const express = require('express');
const router = express.Router();
const businessRequestController = require('../Controllers/businessRequestController');
const authMiddleware = require('../Utility/jwtAuthentication');

router.get('/gridData', authMiddleware, businessRequestController.gridData);
router.get('/ticketID', authMiddleware, businessRequestController.ticketID);

router.get('/employees', authMiddleware, businessRequestController.employees);
router.get('/employeeteam', authMiddleware, businessRequestController.employeeteam);
router.post('/create', authMiddleware, businessRequestController.create);
router.post('/edit', authMiddleware, businessRequestController.edit);
router.get('/view', authMiddleware, businessRequestController.viewApproval);
router.post('/approve', authMiddleware, businessRequestController.approve);
router.post('/reject', authMiddleware, businessRequestController.reject);
router.delete('/delete', authMiddleware, businessRequestController.delete);
router.post('/changePassword', authMiddleware, businessRequestController.changePassword);
module.exports = router;