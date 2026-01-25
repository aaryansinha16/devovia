import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "./snippet.controller";
import { internalServerError, notFoundError, permissionError, successResponse } from "../utils/response.util";

// Get or create project note
export const getProjectNote = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.sub;

    // Verify user has access to the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      return res.status(404).json(notFoundError("Project not found"));
    }

    // Check if user has access (owner or member)
    const isOwner = project.userId === userId;
    const isMember = project.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      return res.status(403).json(permissionError("Access denied"));
    }

    // Get or create note
    let note = await prisma.projectNote.findUnique({
      where: { projectId },
    });

    if (!note) {
      note = await prisma.projectNote.create({
        data: {
          projectId,
          title: "Project Notes",
        },
      });
    }

    res.json(successResponse(note, "Project note retrieved successfully"));
  } catch (error) {
    console.error("Error fetching project note:", error);
    res.status(500).json(internalServerError(error));
  }
};

// Update project note (for Yjs state persistence)
export const updateProjectNote = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { yjsState, content, title } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify user has access to the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      return res.status(404).json(notFoundError("Project not found"));
    }

    // Check if user has access (owner or member)
    const isOwner = project.userId === userId;
    const isMember = project.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      return res.status(403).json(permissionError("Access denied"));
    }

    // Update note
    const note = await prisma.projectNote.upsert({
      where: { projectId },
      update: {
        yjsState: yjsState ? Buffer.from(yjsState, "base64") : undefined,
        content,
        title: title || undefined,
      },
      create: {
        projectId,
        title: title || "Project Notes",
        yjsState: yjsState ? Buffer.from(yjsState, "base64") : undefined,
        content,
      },
    });

    res.json(successResponse(note, "Project note updated successfully"));
  } catch (error) {
    console.error("Error updating project note:", error);
    res.status(500).json(internalServerError(error));
  }
};
