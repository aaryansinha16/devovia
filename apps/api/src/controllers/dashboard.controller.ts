import { Request, Response } from 'express';
import prisma from '../lib/prisma';

/**
 * Get comprehensive dashboard statistics for the authenticated user
 * @route GET /api/dashboard/stats
 */
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get date ranges for comparisons
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch all stats in parallel for better performance
    const [
      // Projects stats
      totalProjects,
      projectsThisWeek,
      projectsLastWeek,
      activeProjects,
      projectsByStatus,
      recentProjects,

      // Snippets stats
      totalSnippets,
      snippetsThisWeek,
      snippetsLastWeek,
      publicSnippets,
      snippetsByLanguage,
      recentSnippets,

      // Runbooks stats
      totalRunbooks,
      runbooksThisWeek,
      runbooksLastWeek,
      activeRunbooks,
      recentRunbookExecutions,
      runbooksByStatus,

      // Deployments stats (DeploymentSite)
      totalDeploymentSites,
      deploymentSitesThisWeek,
      deploymentSitesLastWeek,
      recentDeploymentSites,

      // Blogs stats
      totalBlogs,
      blogsThisWeek,
      blogsLastWeek,
      publishedBlogs,
      recentBlogs,

      // Collaborative Sessions stats
      totalSessions,
      sessionsThisWeek,
      activeSessions,
      recentSessions,

      // Engagement stats
      totalLikes,
      totalComments,
      likesThisWeek,
      commentsThisWeek,

      // Team stats
      projectMemberships,
      teamProjects,
    ] = await Promise.all([
      // Projects
      prisma.project.count({ where: { userId } }),
      prisma.project.count({ where: { userId, createdAt: { gte: oneWeekAgo } } }),
      prisma.project.count({ where: { userId, createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo } } }),
      prisma.project.count({ where: { userId, status: 'IN_PROGRESS' } }),
      prisma.project.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),
      prisma.project.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          visibility: true,
          techStack: true,
          thumbnail: true,
          updatedAt: true,
          createdAt: true,
          _count: {
            select: {
              members: true,
              likes: true,
              comments: true,
            },
          },
        },
      }),

      // Snippets
      prisma.snippet.count({ where: { userId } }),
      prisma.snippet.count({ where: { userId, createdAt: { gte: oneWeekAgo } } }),
      prisma.snippet.count({ where: { userId, createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo } } }),
      prisma.snippet.count({ where: { userId, isPublic: true } }),
      prisma.snippet.groupBy({
        by: ['language'],
        where: { userId },
        _count: true,
        orderBy: { _count: { language: 'desc' } },
        take: 5,
      }),
      prisma.snippet.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          language: true,
          tags: true,
          isPublic: true,
          createdAt: true,
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      }),

      // Runbooks
      prisma.runbook.count({ where: { ownerId: userId } }),
      prisma.runbook.count({ where: { ownerId: userId, createdAt: { gte: oneWeekAgo } } }),
      prisma.runbook.count({ where: { ownerId: userId, createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo } } }),
      prisma.runbook.count({ where: { ownerId: userId, status: 'ACTIVE' } }),
      prisma.runbookExecution.findMany({
        where: {
          runbook: { ownerId: userId },
        },
        orderBy: { startedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          status: true,
          startedAt: true,
          finishedAt: true,
          runbook: {
            select: {
              id: true,
              name: true,
              environment: true,
            },
          },
        },
      }),
      prisma.runbook.groupBy({
        by: ['status'],
        where: { ownerId: userId },
        _count: true,
      }),

      // Deployment Sites
      prisma.deploymentSite.count({
        where: {
          connection: {
            userId,
          },
        },
      }),
      prisma.deploymentSite.count({
        where: {
          connection: {
            userId,
          },
          createdAt: { gte: oneWeekAgo },
        },
      }),
      prisma.deploymentSite.count({
        where: {
          connection: {
            userId,
          },
          createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
        },
      }),
      prisma.deploymentSite.findMany({
        where: {
          connection: {
            userId,
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          slug: true,
          productionUrl: true,
          updatedAt: true,
          connection: {
            select: {
              platform: true,
            },
          },
        },
      }),

      // Blogs
      prisma.post.count({ where: { userId } }),
      prisma.post.count({ where: { userId, createdAt: { gte: oneWeekAgo } } }),
      prisma.post.count({ where: { userId, createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo } } }),
      prisma.post.count({ where: { userId, published: true } }),
      prisma.post.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          published: true,
          coverImage: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      }),

      // Collaborative Sessions
      prisma.collaborativeSession.count({ where: { ownerId: userId } }),
      prisma.collaborativeSession.count({ where: { ownerId: userId, createdAt: { gte: oneWeekAgo } } }),
      prisma.collaborativeSession.count({ where: { ownerId: userId, isActive: true } }),
      prisma.collaborativeSession.findMany({
        where: { ownerId: userId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          language: true,
          isActive: true,
          visibility: true,
          updatedAt: true,
          _count: {
            select: {
              permissions: true,
            },
          },
        },
      }),

      // Engagement
      prisma.like.count({ where: { userId } }),
      prisma.comment.count({ where: { userId } }),
      prisma.like.count({ where: { userId, createdAt: { gte: oneWeekAgo } } }),
      prisma.comment.count({ where: { userId, createdAt: { gte: oneWeekAgo } } }),

      // Team
      prisma.projectMember.count({ where: { userId } }),
      prisma.project.count({
        where: {
          members: {
            some: { userId },
          },
        },
      }),
    ]);

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // Build response
    const stats = {
      overview: {
        projects: {
          total: totalProjects,
          active: activeProjects,
          thisWeek: projectsThisWeek,
          change: calculateChange(projectsThisWeek, projectsLastWeek),
        },
        snippets: {
          total: totalSnippets,
          public: publicSnippets,
          thisWeek: snippetsThisWeek,
          change: calculateChange(snippetsThisWeek, snippetsLastWeek),
        },
        runbooks: {
          total: totalRunbooks,
          active: activeRunbooks,
          thisWeek: runbooksThisWeek,
          change: calculateChange(runbooksThisWeek, runbooksLastWeek),
        },
        deployments: {
          total: totalDeploymentSites,
          active: 0, // Not tracked in schema
          thisWeek: deploymentSitesThisWeek,
          change: calculateChange(deploymentSitesThisWeek, deploymentSitesLastWeek),
        },
        blogs: {
          total: totalBlogs,
          published: publishedBlogs,
          thisWeek: blogsThisWeek,
          change: calculateChange(blogsThisWeek, blogsLastWeek),
        },
        sessions: {
          total: totalSessions,
          active: activeSessions,
          thisWeek: sessionsThisWeek,
        },
        engagement: {
          likes: totalLikes,
          comments: totalComments,
          likesThisWeek,
          commentsThisWeek,
        },
        team: {
          memberships: projectMemberships,
          teamProjects,
        },
      },
      breakdown: {
        projectsByStatus: projectsByStatus.map((item) => ({
          status: item.status,
          count: item._count,
        })),
        snippetsByLanguage: snippetsByLanguage.map((item) => ({
          language: item.language,
          count: item._count,
        })),
        runbooksByStatus: runbooksByStatus.map((item) => ({
          status: item.status,
          count: item._count,
        })),
      },
      recent: {
        projects: recentProjects,
        snippets: recentSnippets,
        runbookExecutions: recentRunbookExecutions,
        deployments: recentDeploymentSites,
        blogs: recentBlogs,
        sessions: recentSessions,
      },
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard statistics',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get activity timeline for the dashboard
 * @route GET /api/dashboard/activity
 */
export const getDashboardActivity = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Fetch recent activities
    const [projects, snippets, blogs, runbooks, deployments] = await Promise.all([
      prisma.project.findMany({
        where: { userId, updatedAt: { gte: oneMonthAgo } },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          updatedAt: true,
          createdAt: true,
        },
      }),
      prisma.snippet.findMany({
        where: { userId, updatedAt: { gte: oneMonthAgo } },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          updatedAt: true,
          createdAt: true,
        },
      }),
      prisma.post.findMany({
        where: { userId, updatedAt: { gte: oneMonthAgo } },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          published: true,
          updatedAt: true,
          createdAt: true,
        },
      }),
      prisma.runbook.findMany({
        where: { ownerId: userId, updatedAt: { gte: oneMonthAgo } },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        select: {
          id: true,
          name: true,
          updatedAt: true,
          createdAt: true,
        },
      }),
      prisma.deploymentSite.findMany({
        where: {
          connection: {
            userId,
          },
          updatedAt: { gte: oneMonthAgo },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        select: {
          id: true,
          name: true,
          updatedAt: true,
          createdAt: true,
        },
      }),
    ]);

    // Combine and sort all activities
    const activities = [
      ...projects.map((p) => ({
        id: p.id,
        type: 'project' as const,
        title: p.title,
        action: p.createdAt.getTime() === p.updatedAt.getTime() ? 'created' : 'updated',
        timestamp: p.updatedAt,
      })),
      ...snippets.map((s) => ({
        id: s.id,
        type: 'snippet' as const,
        title: s.title,
        action: s.createdAt.getTime() === s.updatedAt.getTime() ? 'created' : 'updated',
        timestamp: s.updatedAt,
      })),
      ...blogs.map((b) => ({
        id: b.id,
        type: 'blog' as const,
        title: b.title,
        action: b.published
          ? b.createdAt.getTime() === b.updatedAt.getTime()
            ? 'published'
            : 'updated'
          : 'drafted',
        timestamp: b.updatedAt,
      })),
      ...runbooks.map((r) => ({
        id: r.id,
        type: 'runbook' as const,
        title: r.name,
        action: r.createdAt.getTime() === r.updatedAt.getTime() ? 'created' : 'updated',
        timestamp: r.updatedAt,
      })),
      ...deployments.map((d) => ({
        id: d.id,
        type: 'deployment' as const,
        title: d.name,
        action: d.createdAt.getTime() === d.updatedAt.getTime() ? 'created' : 'updated',
        timestamp: d.updatedAt,
      })),
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error('Error fetching dashboard activity:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard activity',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
