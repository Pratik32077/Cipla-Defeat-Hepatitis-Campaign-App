const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { addDoctor, addVideo, mergeVideo, getAllDoctors, totalDoctors, totalDoctorsByManager, totalVideos, totalDownloadCount } = require('../controller/manager');
const upload = require('../middleware/multer');


const router = express.Router();

router.post('/add-doctor', verifyToken, addDoctor);
router.get('/getAllDoctors', verifyToken, getAllDoctors);
router.get('/totalDoctors', verifyToken, totalDoctors);
router.get('/getTotalDoctorsByManager', totalDoctorsByManager);
router.get('/totalVideos', verifyToken, totalVideos);
router.put('/updateDownloadCount', verifyToken, totalDownloadCount);

module.exports = router;