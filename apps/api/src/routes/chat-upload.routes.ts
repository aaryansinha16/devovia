import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { chatFileUpload } from '../middleware/multer.middleware';
import { Response } from 'express';
import { AuthRequest } from '../controllers/snippet.controller';
import { uploadToR2, getR2DownloadUrl, getR2ViewUrl } from '../utils/r2.util';
import { cleanupTempFile } from '../middleware/multer.middleware';
import {
  internalServerError,
  successResponse,
  validationError,
} from '../utils/response.util';

const router = Router();

// Generic chat file upload (for session chat and other contexts without project)
router.post(
  '/upload',
  requireAuth,
  chatFileUpload.single('file'),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.sub;

      if (!userId) {
        if (req.file) cleanupTempFile(req.file.path);
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!req.file) {
        return res.status(400).json(validationError('No file uploaded'));
      }

      const uploadResult = await uploadToR2(
        req.file.path,
        `chat-files/sessions`,
        req.file.originalname,
        req.file.mimetype,
      );

      cleanupTempFile(req.file.path);

      res.status(200).json(
        successResponse(
          {
            url: uploadResult.key,
            publicId: uploadResult.key,
            name: req.file.originalname,
            size: req.file.size,
            type: req.file.mimetype,
          },
          'File uploaded successfully',
        ),
      );
    } catch (error) {
      if (req.file) cleanupTempFile(req.file.path);
      console.error('Error uploading chat file:', error);
      res.status(500).json(internalServerError(error));
    }
  },
);

// Generate a pre-signed R2 download URL and redirect to it
router.get(
  '/download',
  async (req: AuthRequest, res: Response) => {
    try {
      const { key, name } = req.query;

      if (!key || typeof key !== 'string') {
        return res.status(400).json(validationError('Missing key parameter'));
      }

      const fileName = (typeof name === 'string' && name) ? name : 'download';

      const downloadUrl = await getR2DownloadUrl(key, fileName);
      res.redirect(downloadUrl);
    } catch (error) {
      console.error('Error generating download URL:', error);
      res.status(500).json(internalServerError(error));
    }
  },
);

// Generate a pre-signed R2 view URL (for inline image display) and redirect to it
router.get(
  '/view',
  async (req: AuthRequest, res: Response) => {
    try {
      const { key } = req.query;

      if (!key || typeof key !== 'string') {
        return res.status(400).json(validationError('Missing key parameter'));
      }

      const viewUrl = await getR2ViewUrl(key);
      res.redirect(viewUrl);
    } catch (error) {
      console.error('Error generating view URL:', error);
      res.status(500).json(internalServerError(error));
    }
  },
);

export default router;
