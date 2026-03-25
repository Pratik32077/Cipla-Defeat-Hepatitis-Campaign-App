const express = require('express');
const pool = require('../db/db');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const cloudinary = require('../utils/cloudinary');
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

router.post('/capture-video', verifyToken, upload.single('video'), async (req, res) => {
  const uploadedFile = req.file;

  if (!uploadedFile) {
    return res.status(400).send('Video file is required');
  }

  const rawInputPath = uploadedFile.path;
  const timestamp = Date.now();
  let connection;

  try {
    connection = await pool.getConnection();

    const { doctor_id } = req.body;
    const { id } = req.user;

    if (!id) return res.status(400).send('Missing user id');

    // 🚀 STEP 1: Upload to Cloudinary (convert to mp4)
    console.log("🌐 Uploading to Cloudinary...");
    const result = await cloudinary.uploader.upload(rawInputPath, {
      resource_type: "video",
      format: "mp4",
      public_id: `converted/${timestamp}-${path.parse(uploadedFile.originalname).name}`
    });

    const cloudinaryUrl = result.secure_url;
    console.log("✅ Cloudinary upload done");

    // 🚀 STEP 2: Download video locally from Cloudinary
    const convertedPath = path.join("uploads", `converted-${timestamp}.mp4`);

    const https = require("follow-redirects").https;

    await new Promise((resolve, reject) => {
      https.get(cloudinaryUrl, (response) => {
        const fileStream = fs.createWriteStream(convertedPath);
        response.pipe(fileStream);
        fileStream.on("finish", resolve);
        fileStream.on("error", reject);
      });
    });

    console.log("📥 Downloaded converted video");

    // 🚀 STEP 3: Merge intro + main + outro using FFmpeg
    const intro = path.join(__dirname, "../assets/prefix.mp4");
    const outro = path.join(__dirname, "../assets/postfix.mp4");

    const outputFileName = `merged-${timestamp}.mp4`;
    const outputPath = path.join("uploads", outputFileName);

    console.log("🎬 Merging videos...");

    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(intro)
        .input(convertedPath)
        .input(outro)
        .complexFilter([
          "[0:v][0:a][1:v][1:a][2:v][2:a]concat=n=3:v=1:a=1[outv][outa]"
        ])
        .outputOptions(["-map [outv]", "-map [outa]"])
        .save(outputPath)
        .on("end", resolve)
        .on("error", reject);
    });

    console.log("✅ Video merged");

    const fileStats = fs.statSync(outputPath);
    const duration = await getVideoDuration(outputPath);

    // 🚀 STEP 4: Save in DB
    await connection.query(
      `INSERT INTO video 
        (title, original_filename, processed_filename, file_size, duration, status, processing_progress,
         download_count, created_at, processed_at, capture_type, doctor_id, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `Merged video - ${timestamp}`,
        uploadedFile.originalname,
        outputFileName,
        fileStats.size,
        duration,
        'completed',
        100,
        0,
        new Date(),
        new Date(),
        'upload',
        doctor_id,
        id
      ]
    );

    // 🚀 STEP 5: Return response
    return res.status(200).json({
      message: "Video processed successfully",
      videoUrl: `http://localhost:8080/uploads/${outputFileName}`,
      duration,
      size: fileStats.size
    });

  } catch (error) {
    console.error("❌ Error:", error);
    return res.status(500).send(error.message || "Internal Server Error");
  } finally {
    if (fs.existsSync(rawInputPath)) fs.unlinkSync(rawInputPath);
    if (connection) connection.release();
  }
});

module.exports = router;