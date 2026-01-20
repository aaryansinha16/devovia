import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { PrismaClient } from '@repo/database';
import { Octokit } from '@octokit/rest';
import simpleGit from 'simple-git';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

const GIT_REPOS_BASE = path.join(os.tmpdir(), 'devovia-git-repos');

// Helper to get Octokit instance with user's GitHub token
const getOctokit = async () => {
  // For now, we'll use the GitHub OAuth token from the session
  // In production, you'd store the GitHub access token securely
  const githubToken = process.env.GITHUB_TOKEN; // Fallback to env token

  return new Octokit({
    auth: githubToken,
  });
};

// GET /api/github/repos - List user's GitHub repositories
router.get('/repos', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const octokit = await getOctokit();

    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
    });

    res.json({
      success: true,
      repos: repos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        htmlUrl: repo.html_url,
        cloneUrl: repo.clone_url,
        description: repo.description,
        updatedAt: repo.updated_at,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching GitHub repos:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// POST /api/github/repos/create - Create a new GitHub repository
router.post(
  '/repos/create',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { name, description, isPrivate = true } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Repository name is required' });
      }

      const octokit = await getOctokit();

      const { data: repo } = await octokit.repos.createForAuthenticatedUser({
        name,
        description: description || `Devovia session repository`,
        private: isPrivate,
        auto_init: false,
      });

      res.json({
        success: true,
        repo: {
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          cloneUrl: repo.clone_url,
          htmlUrl: repo.html_url,
        },
      });
    } catch (error: any) {
      console.error('Error creating GitHub repo:', error);
      res
        .status(500)
        .json({ error: error.message || 'Failed to create repository' });
    }
  },
);

// POST /api/github/:sessionId/connect - Connect session to GitHub repo
router.post(
  '/:sessionId/connect',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { repoUrl, branch = 'main' } = req.body;
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!repoUrl) {
        return res.status(400).json({ error: 'Repository URL is required' });
      }

      const repoPath = path.join(GIT_REPOS_BASE, sessionId);
      const git = simpleGit(repoPath);

      // Check if remote already exists
      const remotes = await git.getRemotes(true);
      const originExists = remotes.some((r) => r.name === 'origin');

      if (originExists) {
        // Update existing remote
        await git.remote(['set-url', 'origin', repoUrl]);
      } else {
        // Add new remote
        await git.addRemote('origin', repoUrl);
      }

      // Set upstream branch
      try {
        await git.branch(['--set-upstream-to=origin/' + branch, branch]);
      } catch (e) {
        // Branch might not exist yet, that's okay
      }

      res.json({
        success: true,
        message: 'Connected to GitHub repository',
        remote: repoUrl,
        branch,
      });
    } catch (error: any) {
      console.error('Error connecting to GitHub:', error);
      res.status(500).json({ error: 'Failed to connect to repository' });
    }
  },
);

// POST /api/github/:sessionId/push - Push commits to GitHub
router.post(
  '/:sessionId/push',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { branch = 'main', force = false } = req.body;
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const repoPath = path.join(GIT_REPOS_BASE, sessionId);
      const git = simpleGit(repoPath);

      // Get user info for git config
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, username: true, email: true },
      });

      // Configure git user
      await git.addConfig(
        'user.name',
        user?.name || user?.username || 'Devovia User',
      );
      await git.addConfig('user.email', user?.email || 'user@devovia.dev');

      // Check if remote exists
      const remotes = await git.getRemotes();
      if (remotes.length === 0) {
        return res.status(400).json({
          error: 'No remote repository connected. Connect to GitHub first.',
        });
      }

      // Push to remote
      const pushOptions = force ? ['--force'] : [];
      await git.push('origin', branch, pushOptions);

      res.json({
        success: true,
        message: `Pushed to ${branch} successfully`,
      });
    } catch (error: any) {
      console.error('Error pushing to GitHub:', error);
      res.status(500).json({
        error: error.message || 'Failed to push to repository',
        details: error.message,
      });
    }
  },
);

// POST /api/github/:sessionId/pull - Pull changes from GitHub
router.post(
  '/:sessionId/pull',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { branch = 'main' } = req.body;
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const repoPath = path.join(GIT_REPOS_BASE, sessionId);
      const git = simpleGit(repoPath);

      // Check if remote exists
      const remotes = await git.getRemotes();
      if (remotes.length === 0) {
        return res.status(400).json({
          error: 'No remote repository connected. Connect to GitHub first.',
        });
      }

      // Pull from remote
      await git.pull('origin', branch);

      // Get updated content
      const filePath = path.join(repoPath, 'main.code');
      const content = fs.existsSync(filePath)
        ? fs.readFileSync(filePath, 'utf-8')
        : '';

      res.json({
        success: true,
        message: `Pulled from ${branch} successfully`,
        content,
      });
    } catch (error: any) {
      console.error('Error pulling from GitHub:', error);
      res.status(500).json({
        error: error.message || 'Failed to pull from repository',
        details: error.message,
      });
    }
  },
);

// GET /api/github/:sessionId/remote - Get remote repository info
router.get(
  '/:sessionId/remote',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const repoPath = path.join(GIT_REPOS_BASE, sessionId);
      const git = simpleGit(repoPath);

      const remotes = await git.getRemotes(true);
      const origin = remotes.find((r) => r.name === 'origin');

      if (!origin) {
        return res.json({
          success: true,
          connected: false,
        });
      }

      res.json({
        success: true,
        connected: true,
        remote: {
          name: origin.name,
          url: origin.refs.fetch,
          pushUrl: origin.refs.push,
        },
      });
    } catch (error: any) {
      console.error('Error getting remote info:', error);
      res.status(500).json({ error: 'Failed to get remote info' });
    }
  },
);

// DELETE /api/github/:sessionId/remote - Disconnect from GitHub repo
router.delete(
  '/:sessionId/remote',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const repoPath = path.join(GIT_REPOS_BASE, sessionId);
      const git = simpleGit(repoPath);

      await git.removeRemote('origin');

      res.json({
        success: true,
        message: 'Disconnected from GitHub repository',
      });
    } catch (error: any) {
      console.error('Error disconnecting from GitHub:', error);
      res.status(500).json({ error: 'Failed to disconnect from repository' });
    }
  },
);

export default router;
