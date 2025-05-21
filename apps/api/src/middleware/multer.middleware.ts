import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create a temporary uploads directory for processing files before sending to Cloudinary
const tempUploadsDir = path.join(__dirname, '../../temp-uploads');
const avatarsTempDir = path.join(tempUploadsDir, 'avatars');

// Ensure directories exist
if (!fs.existsSync(tempUploadsDir)) {
  fs.mkdirSync(tempUploadsDir, { recursive: true });
}

if (!fs.existsSync(avatarsTempDir)) {
  fs.mkdirSync(avatarsTempDir, { recursive: true });
}

// Configure storage for temporary uploads
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store avatars in the avatars directory
    if (file.fieldname === 'avatar') {
      cb(null, avatarsTempDir);
    } else {
      cb(null, tempUploadsDir);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${timestamp}-${randomString}${fileExt}`);
  },
});

// Function to filter image files
const imageFileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Only image files are allowed!'));
  }
  cb(null, true);
};

// Function to filter document files
const documentFileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  // Accept documents only (PDF, DOC, DOCX, TXT)
  if (!file.originalname.match(/\.(pdf|doc|docx|txt)$/i)) {
    return cb(new Error('Only document files are allowed!'));
  }
  cb(null, true);
};

// Create multer instances for different types of uploads
export const avatarUpload = multer({
  storage: tempStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max size
  },
  fileFilter: imageFileFilter,
});

export const documentUpload = multer({
  storage: tempStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max size
  },
  fileFilter: documentFileFilter,
});

export const imageUpload = multer({
  storage: tempStorage,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB max size
  },
  fileFilter: imageFileFilter,
});

// Utility function to clean up temporary files after uploading to Cloudinary
export const cleanupTempFile = (filePath: string) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error cleaning up temporary file:', error);
  }
};
