/**
 * Runbook Approvals API Routes
 * Handles approval workflows for manual steps in runbook executions
 */

import { Router, Request, Response } from 'express';
import { PrismaClient, ApprovalStatus, ExecutionStatus } from '@repo/database';
import { authenticateJWT } from '../middleware/auth.middleware';
import { RunbookExecutionService } from '../services/runbook-execution.service';

const router = Router();
const prisma = new PrismaClient();
const executionService = new RunbookExecutionService(prisma);

/**
 * GET /api/runbooks/approvals/pending
 * Get all pending approvals for the current user
 */
router.get('/pending', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const approvals = await prisma.runbookApproval.findMany({
      where: {
        status: ApprovalStatus.PENDING,
        requiredApprovers: {
          has: userId,
        },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        execution: {
          include: {
            runbook: {
              select: {
                id: true,
                name: true,
                description: true,
                environment: true,
              },
            },
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    res.json(approvals);
  } catch (error: any) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ error: 'Failed to fetch pending approvals' });
  }
});

/**
 * GET /api/runbooks/approvals/:id
 * Get approval details
 */
router.get('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const approval = await prisma.runbookApproval.findUnique({
      where: { id },
      include: {
        execution: {
          include: {
            runbook: {
              select: {
                id: true,
                name: true,
                description: true,
                environment: true,
                ownerId: true,
              },
            },
          },
        },
      },
    });

    if (!approval) {
      return res.status(404).json({ error: 'Approval not found' });
    }

    // Check if user is an approver or runbook owner
    const isApprover = approval.requiredApprovers.includes(userId);
    const isOwner = approval.execution.runbook.ownerId === userId;

    if (!isApprover && !isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(approval);
  } catch (error: any) {
    console.error('Error fetching approval:', error);
    res.status(500).json({ error: 'Failed to fetch approval' });
  }
});

/**
 * POST /api/runbooks/approvals/:id/approve
 * Approve a pending approval
 */
router.post(
  '/:id/approve',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const { comment } = req.body;

      const approval = await prisma.runbookApproval.findUnique({
        where: { id },
        include: {
          execution: {
            include: {
              runbook: true,
            },
          },
        },
      });

      if (!approval) {
        return res.status(404).json({ error: 'Approval not found' });
      }

      // Check if user is an approver
      if (!approval.requiredApprovers.includes(userId)) {
        return res
          .status(403)
          .json({ error: 'You are not authorized to approve this' });
      }

      // Check if already processed
      if (approval.status !== ApprovalStatus.PENDING) {
        return res
          .status(400)
          .json({ error: `Approval already ${approval.status.toLowerCase()}` });
      }

      // Check if expired
      if (approval.expiresAt && approval.expiresAt < new Date()) {
        await prisma.runbookApproval.update({
          where: { id },
          data: { status: ApprovalStatus.EXPIRED },
        });
        return res.status(400).json({ error: 'Approval has expired' });
      }

      // Update approval to approved
      const updatedApproval = await prisma.runbookApproval.update({
        where: { id },
        data: {
          approvedBy: userId,
          status: ApprovalStatus.APPROVED,
          respondedAt: new Date(),
          responseNote: comment,
        },
      });

      // Update step result to success
      await prisma.runbookStepResult.updateMany({
        where: {
          executionId: approval.executionId,
          stepIndex: approval.stepIndex,
          status: ExecutionStatus.PAUSED,
        },
        data: {
          status: ExecutionStatus.SUCCESS,
          finishedAt: new Date(),
          output: { approved: true, approvedBy: userId, comment },
        },
      });

      // Resume execution from next step
      executionService.emit('step:approved', {
        executionId: approval.executionId,
        stepIndex: approval.stepIndex,
        approvedBy: userId,
      });

      res.json({
        message: 'Approval complete - execution resumed',
        approval: updatedApproval,
      });
    } catch (error: any) {
      console.error('Error approving:', error);
      res.status(500).json({ error: 'Failed to approve' });
    }
  },
);

/**
 * POST /api/runbooks/approvals/:id/reject
 * Reject a pending approval
 */
router.post(
  '/:id/reject',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }

      const approval = await prisma.runbookApproval.findUnique({
        where: { id },
        include: {
          execution: true,
        },
      });

      if (!approval) {
        return res.status(404).json({ error: 'Approval not found' });
      }

      // Check if user is an approver
      if (!approval.requiredApprovers.includes(userId)) {
        return res
          .status(403)
          .json({ error: 'You are not authorized to reject this' });
      }

      // Check if already processed
      if (approval.status !== ApprovalStatus.PENDING) {
        return res
          .status(400)
          .json({ error: `Approval already ${approval.status.toLowerCase()}` });
      }

      // Update approval to rejected
      const updatedApproval = await prisma.runbookApproval.update({
        where: { id },
        data: {
          status: ApprovalStatus.REJECTED,
          approvedBy: userId, // Store who rejected
          respondedAt: new Date(),
          responseNote: reason,
        },
      });

      // Update step result to failed
      await prisma.runbookStepResult.updateMany({
        where: {
          executionId: approval.executionId,
          stepIndex: approval.stepIndex,
          status: ExecutionStatus.PAUSED,
        },
        data: {
          status: ExecutionStatus.FAILED,
          finishedAt: new Date(),
          output: { rejected: true, rejectedBy: userId, reason },
        },
      });

      // Fail the execution
      await prisma.runbookExecution.update({
        where: { id: approval.executionId },
        data: {
          status: ExecutionStatus.FAILED,
          finishedAt: new Date(),
        },
      });

      executionService.emit('step:rejected', {
        executionId: approval.executionId,
        stepIndex: approval.stepIndex,
        rejectedBy: userId,
        reason,
      });

      res.json({
        message: 'Approval rejected - execution failed',
        approval: updatedApproval,
      });
    } catch (error: any) {
      console.error('Error rejecting:', error);
      res.status(500).json({ error: 'Failed to reject' });
    }
  },
);

/**
 * GET /api/runbooks/approvals/history
 * Get approval history for the current user
 */
router.get('/history', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { page = 1, pageSize = 20 } = req.query;

    const approvals = await prisma.runbookApproval.findMany({
      where: {
        approvedBy: userId,
      },
      include: {
        execution: {
          include: {
            runbook: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { respondedAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });

    const total = await prisma.runbookApproval.count({
      where: {
        approvedBy: userId,
      },
    });

    res.json({
      approvals,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching approval history:', error);
    res.status(500).json({ error: 'Failed to fetch approval history' });
  }
});

export default router;
