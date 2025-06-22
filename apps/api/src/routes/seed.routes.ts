import express from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { seedTestData } from '../controllers/seed.controller';

const router = express.Router();

// Protected route - only authenticated users can seed data
router.post('/test-data', requireAuth, seedTestData);

export default router;
