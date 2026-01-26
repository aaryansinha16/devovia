import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  successResponse,
  paginatedResponse,
  validationError,
  notFoundError,
  internalServerError,
  permissionError,
  alreadyExistsError,
} from '../utils/response.util';
import {
  normalizePagination,
  buildPaginationMeta,
} from '../utils/pagination.util';

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
      return res.status(401).json(validationError('Unauthorized'));
    }

    if (!title || !description) {
      return res
        .status(400)
        .json(validationError('Title and description are required'));
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
        status: status || 'PLANNING',
        visibility: visibility || 'PRIVATE',
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

    return res
      .status(201)
      .json(successResponse(project, 'Project created successfully'));
  } catch (error) {
    console.error('Error creating project:', error);
    return res
      .status(500)
      .json(
        internalServerError(
          process.env.NODE_ENV === 'development' ? error : undefined,
        ),
      );
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
      myProjects,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Normalize pagination
    const { page, limit, offset } = normalizePagination({
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 12,
      maxLimit: 50,
    });

    // Build where clause
    const where: any = {};

    // Filter by search query
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Filter by status
    if (status && status !== 'all') {
      where.status = status;
    }

    // Filter by visibility
    if (visibility && visibility !== 'all') {
      where.visibility = visibility;
      // If filtering by visibility and user is authenticated, still show their own projects
      if (userId) {
        where.OR = [{ visibility: visibility }, { userId: userId }];
        delete where.visibility;
      }
    } else if (!userId) {
      // If not authenticated, only show public projects
      where.visibility = 'PUBLIC';
    } else if (myProjects === 'true') {
      // Show user's own projects
      where.userId = userId;
    } else {
      // Show public projects and user's own projects and team projects
      where.OR = [
        { visibility: 'PUBLIC' },
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

    // Build orderBy
    const orderBy: any = {};
    const validSortFields = ['createdAt', 'updatedAt', 'title'];
    if (validSortFields.includes(sortBy as string)) {
      orderBy[sortBy as string] = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy,
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

    return res.json(
      paginatedResponse(
        projects,
        buildPaginationMeta(page, limit, total),
        'Projects retrieved successfully',
      ),
    );
  } catch (error) {
    console.error('Error fetching projects:', error);
    return res
      .status(500)
      .json(
        internalServerError(
          process.env.NODE_ENV === 'development' ? error : undefined,
        ),
      );
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
          orderBy: { createdAt: 'desc' },
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
      return res.status(404).json(notFoundError('Project not found'));
    }

    // Check visibility permissions
    if (project.visibility === 'PRIVATE') {
      // Private projects: only owner and team members can view
      if (!userId) {
        return res.status(403).json(validationError('Access denied'));
      }
      const isOwner = project.userId === userId;
      const isMember = project.members.some((m) => m.userId === userId);
      if (!isOwner && !isMember) {
        return res.status(403).json(validationError('Access denied'));
      }
    } else if (project.visibility === 'TEAM_ONLY') {
      // Team only projects: only owner and team members can view
      if (!userId) {
        return res.status(403).json(validationError('Access denied'));
      }
      const isOwner = project.userId === userId;
      const isMember = project.members.some((m) => m.userId === userId);
      if (!isOwner && !isMember) {
        return res.status(403).json(validationError('Access denied'));
      }
    }
    // PUBLIC projects: anyone can view (no check needed)

    return res.json(successResponse(project, 'Project retrieved successfully'));
  } catch (error) {
    console.error('Error fetching project:', error);
    return res
      .status(500)
      .json(
        internalServerError(
          process.env.NODE_ENV === 'development' ? error : undefined,
        ),
      );
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
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if project exists and user has permission
    const existingProject = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!existingProject) {
      return res.status(404).json(notFoundError('Project not found'));
    }

    // Check if user is owner or admin
    const isOwner = existingProject.userId === userId;
    const isAdmin = existingProject.members.some(
      (m) => m.userId === userId && (m.role === 'ADMIN' || m.role === 'OWNER'),
    );

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json(
          permissionError("You don't have permission to update this project"),
        );
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

    res.json(successResponse(project, 'Updated project successfully'));
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json(internalServerError(error));
  }
};

// Delete a project
export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if project exists and user owns it
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return res.status(404).json(notFoundError('Project not found'));
    }

    if (existingProject.userId !== userId) {
      return res
        .status(403)
        .json(
          permissionError("You don't have permission to delete this project"),
        );
    }

    await prisma.project.delete({
      where: { id },
    });

    res.json(successResponse({}, 'Project deleted successfully'));
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json(internalServerError(error));
  }
};

// Search for a user by email
export const searchUserByEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.query;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!email || typeof email !== 'string') {
      return res.status(400).json(validationError('Email is required'));
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
      return res.status(404).json(notFoundError('User not found'));
    }

    res.json(successResponse(user, 'User found successfully'));
  } catch (error) {
    console.error('Error searching user:', error);
    res.status(500).json(internalServerError(error));
  }
};

// Add a team member to a project
export const addProjectMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userId: memberUserId, role } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if project exists and user has permission
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!project) {
      return res.status(404).json(notFoundError('Project not found'));
    }

    // Check if user is owner or admin
    const isOwner = project.userId === userId;
    const isAdmin = project.members.some(
      (m) => m.userId === userId && (m.role === 'ADMIN' || m.role === 'OWNER'),
    );

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json(permissionError("You don't have permission to add members"));
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
      return res
        .status(400)
        .json(alreadyExistsError('User is already a member of this project'));
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId: id,
        userId: memberUserId,
        role: role || 'MEMBER',
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

    res.status(201).json(successResponse(member, 'Member added successfully'));
  } catch (error) {
    console.error('Error adding project member:', error);
    res.status(500).json(internalServerError(error));
  }
};

// Update a team member's role
export const updateProjectMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if project exists and user has permission
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!project) {
      return res.status(404).json(notFoundError('Project not found'));
    }

    // Only owner can update member roles
    if (project.userId !== userId) {
      return res
        .status(403)
        .json(
          permissionError('Only the project owner can update member roles'),
        );
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

    res.json(successResponse(member, 'Member updated successfully'));
  } catch (error) {
    console.error('Error updating project member:', error);
    res.status(500).json(internalServerError(error));
  }
};

// Remove a team member from a project
export const removeProjectMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if project exists and user has permission
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!project) {
      return res.status(404).json(notFoundError('Project not found'));
    }

    // Check if user is owner or admin
    const isOwner = project.userId === userId;
    const isAdmin = project.members.some(
      (m) => m.userId === userId && (m.role === 'ADMIN' || m.role === 'OWNER'),
    );

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json(permissionError("You don't have permission to remove members"));
    }

    await prisma.projectMember.delete({
      where: { id: memberId },
    });

    res.json(successResponse({}, 'Member removed successfully'));
  } catch (error) {
    console.error('Error removing project member:', error);
    res.status(500).json(internalServerError(error));
  }
};

// Add a link to a project
export const addProjectLink = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, url, type } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!title || !url || !type) {
      return res
        .status(400)
        .json(validationError('Title, URL, and type are required'));
    }

    // Check if project exists and user has permission
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!project) {
      return res.status(404).json(notFoundError('Project not found'));
    }

    // Check if user is owner, admin, or member
    const isOwner = project.userId === userId;
    const isMember = project.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      return res
        .status(403)
        .json(permissionError("You don't have permission to add links"));
    }

    const link = await prisma.projectLink.create({
      data: {
        projectId: id,
        title,
        url,
        type,
      },
    });

    res.status(201).json(successResponse(link, 'Link added successfully'));
  } catch (error) {
    console.error('Error adding project link:', error);
    res.status(500).json(internalServerError(error));
  }
};

// Update a project link
export const updateProjectLink = async (req: AuthRequest, res: Response) => {
  try {
    const { id, linkId } = req.params;
    const { title, url, type } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if project exists and user has permission
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!project) {
      return res.status(404).json(notFoundError('Project not found'));
    }

    // Check if user is owner, admin, or member
    const isOwner = project.userId === userId;
    const isAdminOrMember = project.members.some(
      (m) => m.userId === userId && (m.role === 'ADMIN' || m.role === 'MEMBER'),
    );

    if (!isOwner && !isAdminOrMember) {
      return res
        .status(403)
        .json(permissionError("You don't have permission to update links"));
    }

    const link = await prisma.projectLink.update({
      where: { id: linkId },
      data: { title, url, type },
    });

    res.json(successResponse(link, 'Link updated successfully'));
  } catch (error) {
    console.error('Error updating project link:', error);
    res.status(500).json(internalServerError(error));
  }
};

// Delete a project link
export const deleteProjectLink = async (req: AuthRequest, res: Response) => {
  try {
    const { id, linkId } = req.params;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if project exists and user has permission
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!project) {
      return res.status(404).json(notFoundError('Project not found'));
    }

    // Check if user is owner or admin
    const isOwner = project.userId === userId;
    const isAdmin = project.members.some(
      (m) => m.userId === userId && (m.role === 'ADMIN' || m.role === 'OWNER'),
    );

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json(permissionError("You don't have permission to delete links"));
    }

    await prisma.projectLink.delete({
      where: { id: linkId },
    });

    res.json(successResponse({}, 'Link deleted successfully'));
  } catch (error) {
    console.error('Error deleting project link:', error);
    res.status(500).json(internalServerError(error));
  }
};
