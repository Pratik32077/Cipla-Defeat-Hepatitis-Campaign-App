const multer = require('multer');
const path = require('path');

// storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname}`)
});

// file filter (FIXED)
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ext === '.webm' || ext === '.mp4') {
    cb(null, true);
  } else {
    cb(new Error('Only .webm or .mp4 files allowed!'));
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;