const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ ensure uploads folder exists
const uploadPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});

// file filter (FIXED)
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (ext === '.mp4') {
    cb(null, true);
  } else if (file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error('Only mp4 or video files allowed!'), false);
  }
};

// multer config
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024 // 200MB
  }
});

module.exports = upload;