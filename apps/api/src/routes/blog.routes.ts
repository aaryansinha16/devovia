import express from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  getAllBlogPosts,
  getBlogPostBySlug,
  getUserBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  uploadBlogImage,
} from '../controllers/blog.controller';
import { imageUpload } from '../middleware/multer.middleware';
import { validate } from '../middleware/validator.middleware';
import { createBlogSchema, updateBlogSchema } from '../validators/blog.validator';

const router = express.Router();

// Public routes
router.get('/', getAllBlogPosts);
router.get('/slug/:slug', getBlogPostBySlug);

// Protected routes (require authentication)
router.get('/user', requireAuth, getUserBlogPosts);
router.post('/', requireAuth, validate(createBlogSchema), createBlogPost);
router.put('/:id', requireAuth, validate(updateBlogSchema), updateBlogPost);
router.delete('/:id', requireAuth, deleteBlogPost);

// Blog image upload route
router.post('/upload-image', requireAuth, imageUpload.single('image'), uploadBlogImage);

export default router;
