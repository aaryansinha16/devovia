import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Type for authenticated request
export type AuthRequest = Request & {
  user?: {
    sub: string;
    email: string;
    role: string;
  };
};

// Create a new snippet
export const createSnippet = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, code, language, tags, isPublic } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!title || !code || !language) {
      return res.status(400).json({ error: "Title, code, and language are required" });
    }

    const snippet = await prisma.snippet.create({
      data: {
        title,
        description: description || null,
        code,
        language,
        tags: tags || [],
        isPublic: isPublic || false,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json({ snippet });
  } catch (error) {
    console.error("Error creating snippet:", error);
    res.status(500).json({ error: "Failed to create snippet" });
  }
};

// Get all snippets for the authenticated user with filters
export const getSnippets = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.sub;
    const { search, language, tag, page = "1", limit = "20" } = req.query;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      userId,
    };

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
      ];
    }

    if (language && language !== "all") {
      where.language = language;
    }

    if (tag && tag !== "all") {
      where.tags = {
        has: tag as string,
      };
    }

    const [snippets, total] = await Promise.all([
      prisma.snippet.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limitNum,
      }),
      prisma.snippet.count({ where }),
    ]);

    res.json({
      snippets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching snippets:", error);
    res.status(500).json({ error: "Failed to fetch snippets" });
  }
};

// Get a single snippet by ID
export const getSnippetById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const snippet = await prisma.snippet.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (!snippet) {
      return res.status(404).json({ error: "Snippet not found" });
    }

    // Check if user owns the snippet or if it's public
    if (snippet.userId !== userId && !snippet.isPublic) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ snippet });
  } catch (error) {
    console.error("Error fetching snippet:", error);
    res.status(500).json({ error: "Failed to fetch snippet" });
  }
};

// Get a public snippet (no auth required)
export const getPublicSnippet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const snippet = await prisma.snippet.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (!snippet) {
      return res.status(404).json({ error: "Snippet not found" });
    }

    if (!snippet.isPublic) {
      return res.status(403).json({ error: "This snippet is private" });
    }

    res.json({ snippet });
  } catch (error) {
    console.error("Error fetching public snippet:", error);
    res.status(500).json({ error: "Failed to fetch snippet" });
  }
};

// Update a snippet
export const updateSnippet = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, code, language, tags, isPublic } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if snippet exists and user owns it
    const existingSnippet = await prisma.snippet.findUnique({
      where: { id },
    });

    if (!existingSnippet) {
      return res.status(404).json({ error: "Snippet not found" });
    }

    if (existingSnippet.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const snippet = await prisma.snippet.update({
      where: { id },
      data: {
        title: title || existingSnippet.title,
        description: description !== undefined ? description : existingSnippet.description,
        code: code || existingSnippet.code,
        language: language || existingSnippet.language,
        tags: tags !== undefined ? tags : existingSnippet.tags,
        isPublic: isPublic !== undefined ? isPublic : existingSnippet.isPublic,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    res.json({ snippet });
  } catch (error) {
    console.error("Error updating snippet:", error);
    res.status(500).json({ error: "Failed to update snippet" });
  }
};

// Delete a snippet
export const deleteSnippet = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if snippet exists and user owns it
    const existingSnippet = await prisma.snippet.findUnique({
      where: { id },
    });

    if (!existingSnippet) {
      return res.status(404).json({ error: "Snippet not found" });
    }

    if (existingSnippet.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    await prisma.snippet.delete({
      where: { id },
    });

    res.json({ message: "Snippet deleted successfully" });
  } catch (error) {
    console.error("Error deleting snippet:", error);
    res.status(500).json({ error: "Failed to delete snippet" });
  }
};
