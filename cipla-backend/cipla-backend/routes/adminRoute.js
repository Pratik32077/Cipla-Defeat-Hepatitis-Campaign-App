const express = require('express');
const { addAdmin, getManager, getManagerInfo, getAllDoctors, totalManagersList, totalDoctorAdded, totalVideoRecorded, getTotalDoctorsList } = require('../controller/adminController');
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