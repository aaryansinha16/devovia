import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  getProjectNote,
  updateProjectNote,
} from "../controllers/project-notes.controller";

const router = Router();

// All routes require authentication
router.get("/:projectId", requireAuth, getProjectNote);
router.put("/:projectId", requireAuth, updateProjectNote);

export default router;
