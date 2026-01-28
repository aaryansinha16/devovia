/**
 * Runbook Approvals Controller
 * Handles business logic for approval workflows in runbook executions
 */

import { Request, Response } from 'express';
import prisma, { ApprovalStatus, ExecutionStatus } from '../lib/prisma';
import { 
  successResponse, 
  errorResponse, 
  notFoundError, 
  permissionError,
  internalServerError,
  validationError,
  paginatedResponse 
} from '../utils/response.util';
import { buildPaginationMeta } from '../utils/pagination.util';
import { RunbookExecutionService } from '../services/runbook-execution.service';

const executionService = new RunbookExecutionService(prisma);

/**
 * Get all pending approvals for the current user
 */
export async function getPendingApprovals(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
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

    res.json(successResponse(approvals, 'Pending approvals retrieved successfully'));
  } catch (error: any) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Get approval details
 */
export async function getApprovalById(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
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
      return res.status(404).json(notFoundError('Approval not found'));
    }

    // Check if user is an approver or runbook owner
    const isApprover = approval.requiredApprovers.includes(userId);
    const isOwner = approval.execution.runbook.ownerId === userId;

    if (!isApprover && !isOwner) {
      return res.status(403).json(permissionError('You do not have permission to view this approval'));
    }

    res.json(successResponse(approval, 'Approval details retrieved successfully'));
  } catch (error: any) {
    console.error('Error fetching approval:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Approve a pending approval
 */
export async function approveApproval(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
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
      return res.status(404).json(notFoundError('Approval not found'));
    }

    // Check if user is an approver
    if (!approval.requiredApprovers.includes(userId)) {
      return res
        .status(403)
        .json(permissionError('You are not authorized to approve this'));
    }

    // Check if already processed
    if (approval.status !== ApprovalStatus.PENDING) {
      return res
        .status(400)
        .json(errorResponse({ code: 'ALREADY_PROCESSED', message: `Approval already ${approval.status.toLowerCase()}` }));
    }

    // Check if expired
    if (approval.expiresAt && approval.expiresAt < new Date()) {
      await prisma.runbookApproval.update({
        where: { id },
        data: { status: ApprovalStatus.EXPIRED },
      });
      return res.status(400).json(errorResponse({ code: 'EXPIRED', message: 'Approval has expired' }));
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

    res.json(successResponse(updatedApproval, 'Approval complete - execution resumed'));
  } catch (error: any) {
    console.error('Error approving:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Reject a pending approval
 */
export async function rejectApproval(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json(validationError('Rejection reason is required'));
    }

    const approval = await prisma.runbookApproval.findUnique({
      where: { id },
      include: {
        execution: true,
      },
    });

    if (!approval) {
      return res.status(404).json(notFoundError('Approval not found'));
    }

    // Check if user is an approver
    if (!approval.requiredApprovers.includes(userId)) {
      return res
        .status(403)
        .json(permissionError('You are not authorized to reject this'));
    }

    // Check if already processed
    if (approval.status !== ApprovalStatus.PENDING) {
      return res
        .status(400)
        .json(errorResponse({ code: 'ALREADY_PROCESSED', message: `Approval already ${approval.status.toLowerCase()}` }));
    }

    // Update approval to rejected
    const updatedApproval = await prisma.runbookApproval.update({
      where: { id },
      data: {
        status: ApprovalStatus.REJECTED,
        approvedBy: userId,
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

    res.json(successResponse(updatedApproval, 'Approval rejected - execution failed'));
  } catch (error: any) {
    console.error('Error rejecting:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Get approval history for the current user
 */
export async function getApprovalHistory(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
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

    res.json(
      paginatedResponse(
        approvals,
        buildPaginationMeta(Number(page), Number(pageSize), total),
        'Approval history retrieved successfully'
      )
    );
  } catch (error: any) {
    console.error('Error fetching approval history:', error);
    res.status(500).json(internalServerError(error));
  }
}
