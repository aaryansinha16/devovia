import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || 'devovia';

export const isR2Configured = (): boolean => {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
};

export interface R2UploadResult {
  key: string;
  url: string;
  size: number;
}

/**
 * Upload a file to Cloudflare R2
 * @param filePath Local path to the file
 * @param folder R2 key prefix / folder
 * @param originalName Original file name for the key
 * @param mimeType MIME type of the file
 */
export const uploadToR2 = async (
  filePath: string,
  folder: string,
  originalName: string,
  mimeType: string,
): Promise<R2UploadResult> => {
  if (!isR2Configured()) {
    throw new Error('Cloudflare R2 credentials not configured');
  }

  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(originalName) || '';
  const uniqueId = crypto.randomBytes(8).toString('hex');
  const key = `${folder}/${uniqueId}${ext}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    }),
  );

  return {
    key,
    url: key, // We use the key as the identifier; actual download goes through our API
    size: fileBuffer.length,
  };
};

/**
 * Generate a pre-signed download URL for a file in R2
 * @param key The R2 object key
 * @param fileName Desired download filename
 * @param expiresIn Seconds until the URL expires (default 300 = 5 min)
 */
export const getR2DownloadUrl = async (
  key: string,
  fileName: string,
  expiresIn = 300,
): Promise<string> => {
  if (!isR2Configured()) {
    throw new Error('Cloudflare R2 credentials not configured');
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
};

/**
 * Generate a pre-signed view URL for inline display (e.g. images)
 * @param key The R2 object key
 * @param expiresIn Seconds until the URL expires (default 3600 = 1 hour)
 */
export const getR2ViewUrl = async (
  key: string,
  expiresIn = 3600,
): Promise<string> => {
  if (!isR2Configured()) {
    throw new Error('Cloudflare R2 credentials not configured');
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ResponseContentDisposition: 'inline',
  });

  return getSignedUrl(r2Client, command, { expiresIn });
};
