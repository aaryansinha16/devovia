import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Type for authenticated request
type AuthRequest = Request & {
  user?: {
    sub: string;
    email: string;
    role: string;
  };
};

// Create a new project
export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      repoUrl,
      demoUrl,
      thumbnail,
      thumbnailPublicId,
      techStack,
      status,
      visibility,
      startDate,
      endDate,
    } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        repoUrl,
        demoUrl,
        thumbnail,
        thumbnailPublicId,
        techStack: techStack || [],
        status: status || "PLANNING",
        visibility: visibility || "PRIVATE",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
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
        members: {
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
        },
        links: true,
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    res.status(201).json({ project });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
};

// Get all projects with filters
export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.sub;
    const {
      search,
      status,
      visibility,
      techStack,
      page = "1",
      limit = "12",
      myProjects,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    // Filter by search query
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
      ];
    }

    // Filter by status
    if (status && status !== "all") {
      where.status = status;
    }

    // Filter by visibility
    if (visibility && visibility !== "all") {
      where.visibility = visibility;
      // If filtering by visibility and user is authenticated, still show their own projects
      if (userId) {
        where.OR = [
          { visibility: visibility },
          { userId: userId },
        ];
        delete where.visibility;
      }
    } else if (!userId) {
      // If not authenticated, only show public projects
      where.visibility = "PUBLIC";
    } else if (myProjects === "true") {
      // Show user's own projects
      where.userId = userId;
    } else {
      // Show public projects and user's own projects and team projects
      where.OR = [
        { visibility: "PUBLIC" },
        { userId: userId },
        {
          members: {
            some: {
              userId: userId,
            },
          },
        },
      ];
    }

    // Filter by tech stack
    if (techStack) {
      where.techStack = {
        hasSome: Array.isArray(techStack) ? techStack : [techStack],
      };
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
          members: {
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
          },
          _count: {
            select: {
              comments: true,
              likes: true,
              links: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    res.json({
      projects,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

// Get a single project by ID
export const getProjectById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.sub;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            bio: true,
          },
        },
        members: {
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
        },
        links: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check visibility permissions
    if (project.visibility === "PRIVATE") {
      // Private projects: only owner and team members can view
      if (!userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const isOwner = project.userId === userId;
      const isMember = project.members.some(m => m.userId === userId);
      if (!isOwner && !isMember) {
        return res.status(403).json({ error: "Access denied" });
      }
    } else if (project.visibility === "TEAM_ONLY") {
      // Team only projects: only owner and team members can view
      if (!userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const isOwner = project.userId === userId;
      const isMember = project.members.some(m => m.userId === userId);
      if (!isOwner && !isMember) {
        return res.status(403).json({ error: "Access denied" });
      }
    }
    // PUBLIC projects: anyone can view (no check needed)

    res.json({ project });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
};

// Update a project
export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      repoUrl,
      demoUrl,
      thumbnail,
      thumbnailPublicId,
      techStack,
      status,
      visibility,
      startDate,
      endDate,
    } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if project exists and user has permission
    const existingProject = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!existingProject) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check if user is owner or admin
    const isOwner = existingProject.userId === userId;
    const isAdmin = existingProject.members.some(
      m => m.userId === userId && (m.role === "ADMIN" || m.role === "OWNER")
    );

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "You don't have permission to update this project" });
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        title,
        description,
        repoUrl,
        demoUrl,
        thumbnail,
        thumbnailPublicId,
        techStack,
        status,
        visibility,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
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
        members: {
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
        },
        links: true,
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    res.json({ project });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
};

// Delete a project
export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if project exists and user owns it
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (existingProject.userId !== userId) {
      return res.status(403).json({ error: "You don't have permission to delete this project" });
    }

    await prisma.project.delete({
      where: { id },
    });

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
};

// Search for a user by email
export const searchUserByEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.query;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Error searching user:", error);
    res.status(500).json({ error: "Failed to search user" });
  }
};

// Add a team member to a project
export const addProjectMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userId: memberUserId, role } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if project exists and user has permission
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check if user is owner or admin
    const isOwner = project.userId === userId;
    const isAdmin = project.members.some(
      m => m.userId === userId && (m.role === "ADMIN" || m.role === "OWNER")
    );

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "You don't have permission to add members" });
    }

    // Check if member already exists
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: memberUserId,
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({ error: "User is already a member of this project" });
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId: id,
        userId: memberUserId,
        role: role || "MEMBER",
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

    res.status(201).json({ member });
  } catch (error) {
    console.error("Error adding project member:", error);
    res.status(500).json({ error: "Failed to add project member" });
  }
};

// Update a team member's role
export const updateProjectMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if project exists and user has permission
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Only owner can update member roles
    if (project.userId !== userId) {
      return res.status(403).json({ error: "Only the project owner can update member roles" });
    }

    const member = await prisma.projectMember.update({
      where: { id: memberId },
      data: { role },
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

    res.json({ member });
  } catch (error) {
    console.error("Error updating project member:", error);
    res.status(500).json({ error: "Failed to update project member" });
  }
};

// Remove a team member from a project
export const removeProjectMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if project exists and user has permission
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check if user is owner or admin
    const isOwner = project.userId === userId;
    const isAdmin = project.members.some(
      m => m.userId === userId && (m.role === "ADMIN" || m.role === "OWNER")
    );

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "You don't have permission to remove members" });
    }

    await prisma.projectMember.delete({
      where: { id: memberId },
    });

    res.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing project member:", error);
    res.status(500).json({ error: "Failed to remove project member" });
  }
};

// Add a link to a project
export const addProjectLink = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, url, type } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!title || !url || !type) {
      return res.status(400).json({ error: "Title, URL, and type are required" });
    }

    // Check if project exists and user has permission
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check if user is owner, admin, or member
    const isOwner = project.userId === userId;
    const isMember = project.members.some(m => m.userId === userId);

    if (!isOwner && !isMember) {
      return res.status(403).json({ error: "You don't have permission to add links" });
    }

    const link = await prisma.projectLink.create({
      data: {
        projectId: id,
        title,
        url,
        type,
      },
    });

    res.status(201).json({ link });
  } catch (error) {
    console.error("Error adding project link:", error);
    res.status(500).json({ error: "Failed to add project link" });
  }
};

// Update a project link
export const updateProjectLink = async (req: AuthRequest, res: Response) => {
  try {
    const { id, linkId } = req.params;
    const { title, url, type } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if project exists and user has permission
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check if user is owner, admin, or member
    const isOwner = project.userId === userId;
    const isAdminOrMember = project.members.some(
      m => m.userId === userId && (m.role === "ADMIN" || m.role === "MEMBER")
    );

    if (!isOwner && !isAdminOrMember) {
      return res.status(403).json({ error: "You don't have permission to update links" });
    }

    const link = await prisma.projectLink.update({
      where: { id: linkId },
      data: { title, url, type },
    });

    res.json({ link });
  } catch (error) {
    console.error("Error updating project link:", error);
    res.status(500).json({ error: "Failed to update project link" });
  }
};

// Delete a project link
export const deleteProjectLink = async (req: AuthRequest, res: Response) => {
  try {
    const { id, linkId } = req.params;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if project exists and user has permission
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check if user is owner or admin
    const isOwner = project.userId === userId;
    const isAdmin = project.members.some(
      m => m.userId === userId && (m.role === "ADMIN" || m.role === "OWNER")
    );

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "You don't have permission to delete links" });
    }

    await prisma.projectLink.delete({
      where: { id: linkId },
    });

    res.json({ message: "Link deleted successfully" });
  } catch (error) {
    console.error("Error deleting project link:", error);
    res.status(500).json({ error: "Failed to delete project link" });
  }
};
