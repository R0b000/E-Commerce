const multer = require('multer');

// Memory storage keeps file buffers in RAM, avoiding saving files to local disk
const storage = multer.memoryStorage();

// File filter to allow only image files
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WEBP, GIF, SVG, AVIF) are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
  },
  fileFilter: imageFilter,
});

module.exports = {
  uploadSingle: upload.single('file'),
  uploadMultiple: upload.array('files', 10),
};
