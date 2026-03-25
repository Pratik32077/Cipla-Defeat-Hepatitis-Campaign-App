const express = require('express');
const pool = require('../db/db');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// helper: get video duration
function getVideoDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration || 0);
    });
  });
}

// ✅ capture-image
router.post('/capture-image', verifyToken, upload.single('photo'), async (req, res) => {
  let connection;
  try {
    const { doctor_id } = req.body;
    const { id } = req.user;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'Photo is required.' });
    }

    connection = await pool.getConnection();

    const insertQuery = `
      INSERT INTO video (
        title, original_filename, capture_image, status, processing_progress,
        download_count, created_at, doctor_id, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)
    `;

    const values = [
      'Captured Image',
      file.originalname,
      file.filename,
      'uploaded',
      0,
      0,
      doctor_id,
      id
    ];

    const [insertResult] = await connection.query(insertQuery, values);

    return res.status(200).json({
      message: 'Capture image saved successfully.',
      inserted_id: insertResult.insertId,
      capture_image: file.filename,
      image_url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: 'Internal server error.' });
  } finally {
    if (connection) connection.release();
  }
});

// ✅ Restored static helper routes
router.get('/image/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../uploads', req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).send('Image not found.');
  res.sendFile(filePath);
});

router.get('/video/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../uploads', req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).send('Video not found.');
  res.sendFile(filePath);
});

module.exports = router;