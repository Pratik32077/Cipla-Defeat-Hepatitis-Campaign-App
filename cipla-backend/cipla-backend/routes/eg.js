const express = require("express");
const pool = require("../db/db");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require("@ffprobe-installer/ffprobe").path;
const fs = require("fs");
const path = require("path");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// get duration
function getVideoDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration || 0);
    });
  });
}

// detect rotation
async function needsRotation(filePath) {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      const rotate = metadata?.streams?.[0]?.tags?.rotate || "0";
      resolve(rotate === "90" || rotate === "270");
    });
  });
}

router.post(
  "/merge-with-intro-outro",
  verifyToken,
  upload.single("video"),
  async (req, res) => {
    const uploadedFile = req.file;

    if (!uploadedFile) {
      return res.status(400).send("Video file required");
    }

    let connection;
    const { doctor_id } = req.body;
    const { id } = req.user;

    const timestamp = Date.now();
    const rawInputPath = uploadedFile.path;
    const rotatedPath = path.join("uploads", `rotated-${timestamp}.mp4`);

    try {
      connection = await pool.getConnection();

      // 🔥 ROTATION FIX
      let inputPath = rawInputPath;
      const shouldRotate = await needsRotation(rawInputPath);

      if (shouldRotate) {
        console.log("↪️ Rotating video...");

        await new Promise((resolve, reject) => {
          ffmpeg(rawInputPath)
            .videoFilter("transpose=1")
            .output(rotatedPath)
            .on("end", resolve)
            .on("error", reject)
            .run();
        });

        inputPath = rotatedPath;
        console.log("✅ Rotation done");
      }

      // 🔥 MERGE VIDEOS (INTRO + MAIN + OUTRO)
      const intro = path.join(__dirname, "../assets/prefix.mp4");
      const outro = path.join(__dirname, "../assets/postfix.mp4");

      const outputFileName = `merged-${timestamp}.mp4`;
      const outputPath = path.join("downloads", outputFileName);

      fs.mkdirSync("downloads", { recursive: true });

      console.log("🎬 Merging videos...");

      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(intro)
          .input(inputPath)
          .input(outro)
          .complexFilter([
            "[0:v][0:a][1:v][1:a][2:v][2:a]concat=n=3:v=1:a=1[outv][outa]"
          ])
          .outputOptions(["-map [outv]", "-map [outa]"])
          .save(outputPath)
          .on("end", resolve)
          .on("error", reject);
      });

      console.log("✅ Merge done");

      const fileStats = fs.statSync(outputPath);
      const duration = await getVideoDuration(outputPath);

      // 🔥 SAVE TO DB
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
          "completed",
          100,
          0,
          new Date(),
          new Date(),
          "upload",
          doctor_id,
          id
        ]
      );

      return res.status(200).json({
        message: "Video processed successfully",
        videoUrl: `http://localhost:8080/api/video/${outputFileName}`
      });

    } catch (error) {
      console.error("❌ ERROR:", error);
      return res.status(500).json({ message: error.message });
    } finally {
      if (fs.existsSync(rawInputPath)) fs.unlinkSync(rawInputPath);
      if (fs.existsSync(rotatedPath)) fs.unlinkSync(rotatedPath);
      if (connection) connection.release();
    }
  }
);

module.exports = router;