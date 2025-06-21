import express from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { deleteComment } from '../controllers/comment.controller';

const router = express.Router();

// Delete comment route
router.delete('/:commentId', requireAuth, deleteComment);

export default router;
