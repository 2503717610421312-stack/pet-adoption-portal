const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// ---------------------------------------------------------------
// Cloudinary Configuration
// Set these in your .env (local) and Vercel environment variables:
//   CLOUDINARY_CLOUD_NAME=your_cloud_name
//   CLOUDINARY_API_KEY=your_api_key
//   CLOUDINARY_API_SECRET=your_api_secret
// ---------------------------------------------------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Store files directly to Cloudinary (no local disk needed)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'pawhaven/pets',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 800, height: 600, crop: 'limit', quality: 'auto' }],
    public_id: (req, file) => {
      const cleanBase = file.originalname
        .replace(/\.[^/.]+$/, '')          // remove extension
        .replace(/[^a-zA-Z0-9_-]/g, '');  // sanitize name
      return `${cleanBase}-${Date.now()}`;
    }
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMime.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: fileFilter
});

module.exports = upload;
