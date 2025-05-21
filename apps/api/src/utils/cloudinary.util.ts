import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true,
});

/**
 * Helper function to check if Cloudinary is properly configured
 */
export const isCloudinaryConfigured = (): boolean => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

/**
 * Interface for upload result
 */
export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  secure_url: string;
  original_filename: string;
}

/**
 * Upload a file to Cloudinary
 * @param filePath Path to the file to upload
 * @param folder Optional folder in Cloudinary
 * @returns Promise with upload result
 */
export const uploadToCloudinary = async (
  filePath: string,
  folder = 'devovia',
): Promise<UploadResult> => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary credentials not configured');
  }

  try {
    // Upload the image
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      resource_type: 'auto',
    });

    // Return the result
    return {
      url: result.url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      secure_url: result.secure_url,
      original_filename: result.original_filename,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

/**
 * Upload an avatar image to Cloudinary
 * @param filePath Path to the avatar image
 * @param userId User ID for the avatar
 * @returns Promise with upload result
 */
export const uploadAvatarToCloudinary = async (
  filePath: string,
  userId: string,
): Promise<UploadResult> => {
  return uploadToCloudinary(filePath, `devovia/avatars/${userId}`);
};

/**
 * Delete an image from Cloudinary by public ID
 * @param publicId Cloudinary public ID of the image
 * @returns Promise with deletion result
 */
export const deleteFromCloudinary = async (
  publicId: string,
): Promise<boolean> => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary credentials not configured');
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
};

/**
 * Generate a Cloudinary transformation URL
 * @param url Original Cloudinary URL
 * @param options Transformation options
 * @returns Transformed URL
 */
export const getTransformedUrl = (
  url: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'scale' | 'fit' | 'thumb';
    gravity?: 'face' | 'auto' | 'center';
    quality?: number;
    format?: 'jpg' | 'png' | 'webp' | 'auto';
  },
): string => {
  if (!url.includes('cloudinary.com')) {
    return url;
  }

  const transformations: string[] = [];

  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.gravity) transformations.push(`g_${options.gravity}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.format) transformations.push(`f_${options.format}`);

  if (transformations.length === 0) {
    return url;
  }

  // Insert transformations into the URL
  // URL format: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/image.jpg
  const parts = url.split('/upload/');
  if (parts.length !== 2) {
    return url;
  }

  return `${parts[0]}/upload/${transformations.join(',')}/v${parts[1].split('/v')[1]}`;
};
