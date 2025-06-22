import express from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  getAllBlogPosts,
  getBlogPostBySlug,
  getBlogPostById,
  listAllBlogIds,
  getUserBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  uploadBlogImage,
} from '../controllers/blog.controller';
import { getBlogComments, addComment } from '../controllers/comment.controller';
import { likeBlogPost, unlikeBlogPost, checkUserLike } from '../controllers/like.controller';
import { imageUpload } from '../middleware/multer.middleware';
import { validate } from '../middleware/validator.middleware';
import { createBlogSchema, updateBlogSchema } from '../validators/blog.validator';

const router = express.Router();

// Public routes
router.get('/', getAllBlogPosts);
router.get('/slug/:slug', getBlogPostBySlug);
router.get('/debug/list-ids', listAllBlogIds); // Debug endpoint

// Protected routes (require authentication)
// Important: Place specific routes BEFORE wildcard routes
router.get('/user', requireAuth, getUserBlogPosts);

// Wildcard route for getting blog by ID - must be AFTER all specific routes
router.get('/:id', getBlogPostById);
router.post('/', requireAuth, validate(createBlogSchema), createBlogPost);
router.put('/:id', requireAuth, validate(updateBlogSchema), updateBlogPost);
router.delete('/:id', requireAuth, deleteBlogPost);

// Blog image upload route
router.post('/upload-image', requireAuth, imageUpload.single('image'), uploadBlogImage);

// Comment routes
router.get('/:postId/comments', getBlogComments);
router.post('/:postId/comments', requireAuth, addComment);

// Like routes
router.post('/:postId/like', requireAuth, likeBlogPost);
router.delete('/:postId/like', requireAuth, unlikeBlogPost);
router.get('/:postId/like', requireAuth, checkUserLike);

export default router;
