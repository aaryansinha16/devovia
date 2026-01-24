import { Router } from "express";
import { authenticateJWT } from "../middleware/auth.middleware";
import {
  createSnippet,
  getSnippets,
  getSnippetById,
  updateSnippet,
  deleteSnippet,
  getPublicSnippet,
} from "../controllers/snippet.controller";

const router = Router();

// Public routes
router.get("/public/:id", getPublicSnippet);

// Protected routes
router.use(authenticateJWT);

router.post("/", createSnippet);
router.get("/", getSnippets);
router.get("/:id", getSnippetById);
router.put("/:id", updateSnippet);
router.delete("/:id", deleteSnippet);

export default router;
