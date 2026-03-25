const express = require('express');
const { addAdmin, getManager, getManagerInfo, totalManagersList, totalDoctorAdded, totalVideoRecorded, getTotalDoctorsList } = require('../controller/adminController');

// Alias for consistency with naming in routes
const getAllDoctors = getTotalDoctorsList;

const { verifyToken, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/add-admin', addAdmin);
router.get('/getAllDoctors', verifyToken, getAllDoctors);
router.get('/getManagerInfo', getManagerInfo);
router.get('/totalManager', totalManagersList);
router.get('/totalDoctorAdded', totalDoctorAdded);
router.get('/totalVideosRecorded', totalVideoRecorded);
router.get('/totalDoctorsList', getTotalDoctorsList);

module.exports = router;