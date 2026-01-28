/**
 * GitHub Integration Controller
 * Handles business logic for GitHub repository integration
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@repo/database';
import { Octokit } from '@octokit/rest';
import simpleGit from 'simple-git';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { 
  successResponse, 
  errorResponse, 
  notFoundError, 
  permissionError,
  internalServerError,
  validationError 
} from '../utils/response.util';

const prisma = new PrismaClient();
const GIT_REPOS_BASE = path.join(os.tmpdir(), 'devovia-git-repos');

const getOctokit = async () => {
  const githubToken = process.env.GITHUB_TOKEN;
  return new Octokit({ auth: githubToken });
};

export async function listGitHubRepos(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const octokit = await getOctokit();
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
    });

    res.json(successResponse({
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
    }));
  } catch (error: any) {
    console.error('Error fetching GitHub repos:', error);
    res.status(500).json(internalServerError(error));
  }
}

export async function createGitHubRepo(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const { name, description, isPrivate = true } = req.body;

    if (!name) {
      return res.status(400).json(validationError('Repository name is required'));
    }

    const octokit = await getOctokit();
    const { data: repo } = await octokit.repos.createForAuthenticatedUser({
      name,
      description: description || `Devovia session repository`,
      private: isPrivate,
      auto_init: false,
    });

    res.json(successResponse({
      repo: {
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        cloneUrl: repo.clone_url,
        htmlUrl: repo.html_url,
      },
    }, 'Repository created successfully'));
  } catch (error: any) {
    console.error('Error creating GitHub repo:', error);
    res.status(500).json(internalServerError(error.message || 'Failed to create repository'));
  }
}

export async function connectToGitHub(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { repoUrl, branch = 'main' } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!repoUrl) {
      return res.status(400).json(validationError('Repository URL is required'));
    }

    const repoPath = path.join(GIT_REPOS_BASE, sessionId);
    const git = simpleGit(repoPath);

    const remotes = await git.getRemotes(true);
    const originExists = remotes.some((r) => r.name === 'origin');

    if (originExists) {
      await git.remote(['set-url', 'origin', repoUrl]);
    } else {
      await git.addRemote('origin', repoUrl);
    }

    try {
      await git.branch(['--set-upstream-to=origin/' + branch, branch]);
    } catch (e) {
      // Branch might not exist yet
    }

    res.json(successResponse({ remote: repoUrl, branch }, 'Connected to GitHub repository'));
  } catch (error: any) {
    console.error('Error connecting to GitHub:', error);
    res.status(500).json(internalServerError(error));
  }
}

export async function pushToGitHub(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { branch = 'main', force = false } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const repoPath = path.join(GIT_REPOS_BASE, sessionId);
    const git = simpleGit(repoPath);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, username: true, email: true },
    });

    await git.addConfig('user.name', user?.name || user?.username || 'Devovia User');
    await git.addConfig('user.email', user?.email || 'user@devovia.dev');

    const remotes = await git.getRemotes();
    if (remotes.length === 0) {
      return res.status(400).json(errorResponse({ code: 'NO_REMOTE', message: 'No remote repository connected. Connect to GitHub first.' }));
    }

    const pushOptions = force ? ['--force'] : [];
    await git.push('origin', branch, pushOptions);

    res.json(successResponse(null, `Pushed to ${branch} successfully`));
  } catch (error: any) {
    console.error('Error pushing to GitHub:', error);
    res.status(500).json(internalServerError(error.message || 'Failed to push to repository'));
  }
}

export async function pullFromGitHub(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { branch = 'main' } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const repoPath = path.join(GIT_REPOS_BASE, sessionId);
    const git = simpleGit(repoPath);

    const remotes = await git.getRemotes();
    if (remotes.length === 0) {
      return res.status(400).json(errorResponse({ code: 'NO_REMOTE', message: 'No remote repository connected. Connect to GitHub first.' }));
    }

    await git.pull('origin', branch);

    const filePath = path.join(repoPath, 'main.code');
    const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';

    res.json(successResponse({ content }, `Pulled from ${branch} successfully`));
  } catch (error: any) {
    console.error('Error pulling from GitHub:', error);
    res.status(500).json(internalServerError(error.message || 'Failed to pull from repository'));
  }
}

export async function getRemoteInfo(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const repoPath = path.join(GIT_REPOS_BASE, sessionId);
    const git = simpleGit(repoPath);

    const remotes = await git.getRemotes(true);
    const origin = remotes.find((r) => r.name === 'origin');

    if (!origin) {
      return res.json(successResponse({
        connected: false,
      }));
    }

    res.json(successResponse({
      connected: true,
      remote: {
        name: origin.name,
        url: origin.refs.fetch,
        pushUrl: origin.refs.push,
      },
    }));
  } catch (error: any) {
    console.error('Error getting remote info:', error);
    res.status(500).json(internalServerError(error));
  }
}

export async function disconnectFromGitHub(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const repoPath = path.join(GIT_REPOS_BASE, sessionId);
    const git = simpleGit(repoPath);

    await git.removeRemote('origin');

    res.json(successResponse(null, 'Disconnected from GitHub repository'));
  } catch (error: any) {
    console.error('Error disconnecting from GitHub:', error);
    res.status(500).json(internalServerError(error));
  }
}
