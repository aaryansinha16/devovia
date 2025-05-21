import multer from 'multer';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');

// Ensure directories exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// Configure storage for avatar uploads
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with user ID (from JWT) and timestamp
    const userId = req.user?.sub || 'unknown';
    const timestamp = Date.now();
    const fileExt = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${userId}-${timestamp}${fileExt}`);
  },
});

// Function to filter image files
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Only image files are allowed!'));
  }
  cb(null, true);
};

// Create multer instance for avatar uploads
export const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max size
  },
  fileFilter: imageFileFilter,
});

// Function to get the URL for an uploaded avatar
export const getAvatarUrl = (filename: string): string => {
  // For local development, return a path
  // In production, this would be a CDN URL
  const baseUrl = process.env.API_URL || 'http://localhost:4000';
  return `${baseUrl}/uploads/avatars/${filename}`;
};
