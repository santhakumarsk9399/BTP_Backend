const jwt = require('jsonwebtoken');
require('dotenv').config();

const express = require('express');
const router = express.Router();

// Generate JWT Token (24 hours)
function generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
}

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    //jwt.sign(authHeader, process.env.JWT_SECRET, { expiresIn: '24h' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        // const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // console.log("Decoded:", decoded);
        if (err) return res.status(403).json({ message: 'Invalid Token. Please login.' });
        req.user = user;
        next();
    });
};