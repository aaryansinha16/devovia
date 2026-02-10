/**
 * Supercharged Mode — Per-User Rate Limiting
 *
 * Checks daily command count from the database.
 * Free users: 25 commands/day
 * Premium users: 200 commands/day (when subscription system is added)
 *
 * Also includes a basic safety filter for prompt injection / harmful content.
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

// ─── Quota config ────────────────────────────────────────────────────────────

const DAILY_QUOTA = {
  free: 25,
  premium: 200,
};

// ─── Rate limit middleware ───────────────────────────────────────────────────

export const superchargedRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Count commands in the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const commandCount = await prisma.superchargedCommand.count({
      where: {
        userId,
        createdAt: { gte: since },
      },
    });

    // TODO: Check user subscription tier when billing is implemented
    // For now, all users get the free tier quota
    const quota = DAILY_QUOTA.free;

    if (commandCount >= quota) {
      return res.status(429).json({
        success: false,
        message: `You've reached your daily limit of ${quota} Supercharged commands. Upgrade to Premium for ${DAILY_QUOTA.premium} commands/day.`,
        data: {
          used: commandCount,
          limit: quota,
          resetsAt: new Date(since.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        },
      });
    }

    // Attach usage info to request for downstream use
    (req as any).superchargedUsage = {
      used: commandCount,
      limit: quota,
      remaining: quota - commandCount,
    };

    next();
  } catch (error) {
    console.error('Supercharged rate limit error:', error);
    next(); // Fail open — don't block users if rate limit check fails
  }
};

// ─── Safety filter middleware ────────────────────────────────────────────────

const BLOCKED_PATTERNS = [
  // Prompt injection attempts
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(all\s+)?above\s+instructions/i,
  /you\s+are\s+now\s+(?:a|an)\s+(?:different|new)/i,
  /system\s*:\s*/i,
  /\bact\s+as\b.*\b(?:admin|root|superuser)\b/i,
  /pretend\s+(?:you\s+are|to\s+be)/i,
  /override\s+(?:your|the)\s+(?:instructions|rules|system)/i,
  /forget\s+(?:your|all|the)\s+(?:instructions|rules|previous)/i,
  /jailbreak/i,
  /DAN\s+mode/i,
  // Harmful content
  /\b(?:drop\s+table|delete\s+from|truncate|exec\s*\()\b/i,
  /\b(?:rm\s+-rf|sudo\s+rm|format\s+c:)\b/i,
];

export const superchargedSafetyFilter = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { input } = req.body;
  if (!input || typeof input !== 'string') {
    return next();
  }

  const trimmed = input.trim();

  // Check length limit (prevent token abuse)
  if (trimmed.length > 500) {
    return res.status(400).json({
      success: false,
      message: 'Command is too long. Please keep it under 500 characters.',
    });
  }

  // Check blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return res.status(400).json({
        success: false,
        message: 'Your message was flagged by our safety filter. Please rephrase your command.',
      });
    }
  }

  next();
};
