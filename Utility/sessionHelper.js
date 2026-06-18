const session = require('express-session');
exports.isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized. Please login.' });
    }
};