import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  searchUserByEmail,
  addProjectMember,
  updateProjectMember,
  removeProjectMember,
  addProjectLink,
  updateProjectLink,
  deleteProjectLink,
} from '../controllers/project.controller';

const router = Router();

// Public routes with optional auth (to support viewing private projects when logged in)
router.get('/', optionalAuth, getProjects);
router.get('/:id', optionalAuth, getProjectById);

// Protected routes - Project CRUD
router.post('/', requireAuth, createProject);
router.put('/:id', requireAuth, updateProject);
router.delete('/:id', requireAuth, deleteProject);

// Protected routes - Team management
router.get('/search/user', requireAuth, searchUserByEmail);
router.post('/:id/members', requireAuth, addProjectMember);
router.put('/:id/members/:memberId', requireAuth, updateProjectMember);
router.delete('/:id/members/:memberId', requireAuth, removeProjectMember);

// Protected routes - Links management
router.post('/:id/links', requireAuth, addProjectLink);
router.put('/:id/links/:linkId', requireAuth, updateProjectLink);
router.delete('/:id/links/:linkId', requireAuth, deleteProjectLink);

export default router;
