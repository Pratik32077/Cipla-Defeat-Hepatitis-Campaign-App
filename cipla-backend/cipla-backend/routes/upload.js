const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
ffmpeg.setFfmpegPath(ffmpegPath);

const path = require("path");

const router = express.Router();
router.post("/capture-video", verifyToken, upload.single("video"), async (req, res) => {
    try {
        console.log("FILE:", req.file);

        if (!req.file) {
            return res.status(400).json({ message: "No video uploaded" });
        }

        const inputVideo = req.file.path;
        const intro = path.join(__dirname, "../assets/prefix.mp4");
        const outro = path.join(__dirname, "../assets/postfix.mp4");

        const output = `uploads/merged-${Date.now()}.mp4`;

        console.log("🎬 Formatting and merging videos...");

        ffmpeg()
            .input(intro)
            .input(inputVideo)
            .input(outro)
            // Normalize ALL streams to exact same properties before concatenating
            .complexFilter([
                "[0:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30,setsar=1[v0]",
                "[1:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30,setsar=1[v1]",
                "[2:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30,setsar=1[v2]",
                "[0:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[a0]",
                "[1:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[a1]",
                "[2:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[a2]",
                "[v0][a0][v1][a1][v2][a2]concat=n=3:v=1:a=1[outv][outa]"
            ])
            .outputOptions([
                "-map [outv]",
                "-map [outa]",
                "-c:v libx264",
                "-c:a aac",
                "-preset fast",
                "-crf 23"
            ])
            .on("start", (cmd) => console.log("FFMPEG CMD:", cmd))
            .on("end", () => {
                console.log("✅ Video merged successfully");
                return res.json({
                    message: "Upload and merge success",
                    file: output
                });
            })
            .on("error", (err) => {
                console.error("❌ FFMPEG ERROR:", err.message);
                return res.status(500).json({
                    message: "FFmpeg merge failed",
                    error: err.message
                });
            })
            .save(output);

    } catch (error) {
        console.error("UPLOAD ERROR:", error.message);
        res.status(500).json({ message: "Upload failed" });
    }
});

module.exports = router;