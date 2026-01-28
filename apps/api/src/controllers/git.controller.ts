/**
 * Git Controller
 * Handles business logic for git operations in collaborative sessions
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@repo/database';
import simpleGit, { SimpleGit, StatusResult, LogResult } from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { 
  successResponse, 
  errorResponse, 
  notFoundError, 
  permissionError,
  internalServerError,
  validationError 
} from '../utils/response.util';

const prisma = new PrismaClient();

// Base directory for session git repositories
const GIT_REPOS_BASE = path.join(os.tmpdir(), 'devovia-git-repos');

// Ensure base directory exists
if (!fs.existsSync(GIT_REPOS_BASE)) {
  fs.mkdirSync(GIT_REPOS_BASE, { recursive: true });
}

// Get or create git repo for a session
const getSessionGit = async (
  sessionId: string
): Promise<{ git: SimpleGit; repoPath: string }> => {
  const repoPath = path.join(GIT_REPOS_BASE, sessionId);

  if (!fs.existsSync(repoPath)) {
    fs.mkdirSync(repoPath, { recursive: true });
  }

  const git = simpleGit(repoPath);

  // Check if it's already a git repo
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    await git.init();
    // Create initial file
    const filePath = path.join(repoPath, 'main.code');
    fs.writeFileSync(filePath, '// Session code\n');
    await git.add('.');
    await git.commit('Initial commit');
  }

  return { git, repoPath };
};

/**
 * Get git status for a session
 */
export async function getGitStatus(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    // Verify session access
    const session = await prisma.collaborativeSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return res.status(404).json(notFoundError('Session not found'));
    }

    const { git } = await getSessionGit(sessionId);
    const status: StatusResult = await git.status();
    const branches = await git.branchLocal();

    res.json(successResponse({
      status: {
        current: status.current,
        tracking: status.tracking,
        ahead: status.ahead,
        behind: status.behind,
        staged: status.staged,
        modified: status.modified,
        created: status.created,
        deleted: status.deleted,
        conflicted: status.conflicted,
        isClean: status.isClean(),
      },
      branches: branches.all,
      currentBranch: branches.current,
    }));
  } catch (error: any) {
    console.error('Error getting git status:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Get commit history
 */
export async function getGitLog(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { limit = '50' } = req.query;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const { git } = await getSessionGit(sessionId);
    const log: LogResult = await git.log({
      maxCount: parseInt(limit as string),
    });

    res.json(successResponse({
      commits: log.all.map((commit) => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        author: commit.author_name,
        email: commit.author_email,
      })),
      total: log.total,
    }));
  } catch (error: any) {
    console.error('Error getting git log:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Create a commit
 */
export async function createCommit(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { message, content } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    if (!message) {
      return res.status(400).json(validationError('Commit message is required'));
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, username: true, email: true },
    });

    const { git, repoPath } = await getSessionGit(sessionId);

    // Write content to file
    const filePath = path.join(repoPath, 'main.code');
    fs.writeFileSync(filePath, content || '');

    // Configure git user for this commit
    await git.addConfig(
      'user.name',
      user?.name || user?.username || 'Anonymous'
    );
    await git.addConfig('user.email', user?.email || 'anonymous@devovia.dev');

    // Stage and commit
    await git.add('.');
    const result = await git.commit(message);

    res.json(successResponse({ 
      commit: {
        hash: result.commit,
        message,
        author: user?.name || user?.username,
      },
    }));
  } catch (error: any) {
    console.error('Error creating commit:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Create a new branch
 */
export async function createBranch(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { branchName } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    if (!branchName) {
      return res.status(400).json(validationError('Branch name is required'));
    }

    const { git } = await getSessionGit(sessionId);
    await git.checkoutLocalBranch(branchName);

    res.json(successResponse({ branch: branchName }, 'Branch created successfully'));
  } catch (error: any) {
    console.error('Error creating branch:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Switch to a branch
 */
export async function checkoutBranch(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { branchName } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    if (!branchName) {
      return res.status(400).json(validationError('Branch name is required'));
    }

    const { git, repoPath } = await getSessionGit(sessionId);
    await git.checkout(branchName);

    // Read current file content
    const filePath = path.join(repoPath, 'main.code');
    const content = fs.existsSync(filePath)
      ? fs.readFileSync(filePath, 'utf-8')
      : '';

    res.json(successResponse({ branch: branchName, content }, 'Branch checked out successfully'));
  } catch (error: any) {
    console.error('Error checking out branch:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Get diff between commits or branches
 */
export async function getDiff(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { from, to } = req.query;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const { git } = await getSessionGit(sessionId);

    let diff: string;
    if (from && to) {
      diff = await git.diff([`${from}`, `${to}`]);
    } else if (from) {
      diff = await git.diff([`${from}`]);
    } else {
      diff = await git.diff();
    }

    res.json(successResponse({ diff }));
  } catch (error: any) {
    console.error('Error getting diff:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Get content at a specific commit
 */
export async function showCommit(req: Request, res: Response) {
  try {
    const { sessionId, commitHash } = req.params;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const { git } = await getSessionGit(sessionId);
    const content = await git.show([`${commitHash}:main.code`]);

    res.json(successResponse({ content }));
  } catch (error: any) {
    console.error('Error showing commit:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Revert to a specific commit
 */
export async function revertToCommit(req: Request, res: Response) {
  try {
    const { sessionId, commitHash } = req.params;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const { git, repoPath } = await getSessionGit(sessionId);

    // Get content at that commit
    const content = await git.show([`${commitHash}:main.code`]);

    // Write it to the file
    const filePath = path.join(repoPath, 'main.code');
    fs.writeFileSync(filePath, content);

    res.json(successResponse({ content }, 'Reverted to commit successfully'));
  } catch (error: any) {
    console.error('Error reverting to commit:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Delete a branch
 */
export async function deleteBranch(req: Request, res: Response) {
  try {
    const { sessionId, branchName } = req.params;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    if (branchName === 'main' || branchName === 'master') {
      return res
        .status(400)
        .json(errorResponse({ code: 'INVALID_OPERATION', message: 'Cannot delete main/master branch' }));
    }

    const { git } = await getSessionGit(sessionId);
    await git.deleteLocalBranch(branchName, true);

    res.json(successResponse(null, `Branch ${branchName} deleted successfully`));
  } catch (error: any) {
    console.error('Error deleting branch:', error);
    res.status(500).json(internalServerError(error));
  }
}
