const express = require('express');
const router = express.Router();
const loginController = require('../Controllers/loginController');
const authMiddleware = require('../Utility/jwtAuthentication');
const { isAuthenticated } = require('../Utility/sessionHelper');

router.post('/login', loginController.login);
router.post('/logout', authMiddleware, loginController.logout);

module.exports = router;