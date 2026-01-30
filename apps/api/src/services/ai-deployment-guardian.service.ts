/**
 * AI Deployment Guardian Service
 * Analyzes deployments for risk factors and provides AI-powered insights
 */

import OpenAI from 'openai';
import prisma from '../lib/prisma';

const db = prisma as any;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface DeploymentRiskAnalysis {
  riskScore: number; // 0-100
  riskFactors: string[];
  aiSummary: string;
  aiSuggestions: string[];
}

export class AIDeploymentGuardianService {
  /**
   * Analyze a deployment for risk factors
   */
  async analyzeDeployment(deploymentId: string): Promise<DeploymentRiskAnalysis> {
    try {
      // Fetch deployment with related data
      const deployment = await db.deployment.findUnique({
        where: { id: deploymentId },
        include: {
          site: {
            include: {
              connection: true,
            },
          },
          events: {
            orderBy: { timestamp: 'desc' },
            take: 20,
          },
          logs: {
            orderBy: { timestamp: 'desc' },
            take: 50,
          },
        },
      });

      if (!deployment) {
        throw new Error('Deployment not found');
      }

      // Get deployment history for context
      const recentDeployments = await db.deployment.findMany({
        where: {
          siteId: deployment.siteId,
          id: { not: deploymentId },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          status: true,
          environment: true,
          buildDuration: true,
          errorMessage: true,
          createdAt: true,
        },
      });

      // Build context for AI analysis
      const context = this.buildAnalysisContext(deployment, recentDeployments);

      // Call OpenAI for analysis
      const analysis = await this.performAIAnalysis(context);

      // Update deployment with AI insights
      await db.deployment.update({
        where: { id: deploymentId },
        data: {
          riskScore: analysis.riskScore,
          riskFactors: analysis.riskFactors,
          aiSummary: analysis.aiSummary,
          aiSuggestions: analysis.aiSuggestions,
        },
      });

      return analysis;
    } catch (error) {
      console.error('Error analyzing deployment:', error);
      throw error;
    }
  }

  /**
   * Build context string for AI analysis
   */
  private buildAnalysisContext(deployment: any, recentDeployments: any[]): string {
    const errorLogs = deployment.logs?.filter((log: any) => log.level === 'error') || [];
    const warningLogs = deployment.logs?.filter((log: any) => log.level === 'warn') || [];
    
    const failureRate = recentDeployments.length > 0
      ? (recentDeployments.filter(d => d.status === 'ERROR').length / recentDeployments.length) * 100
      : 0;

    return `
# Deployment Analysis Request

## Current Deployment
- **ID**: ${deployment.id}
- **Site**: ${deployment.site?.name || 'Unknown'}
- **Environment**: ${deployment.environment}
- **Status**: ${deployment.status}
- **Branch**: ${deployment.gitBranch || 'N/A'}
- **Commit**: ${deployment.gitCommitSha?.substring(0, 7) || 'N/A'}
- **Commit Message**: ${deployment.gitCommitMessage || 'N/A'}
- **Build Duration**: ${deployment.buildDuration ? `${deployment.buildDuration}s` : 'In progress'}
- **Error Message**: ${deployment.errorMessage || 'None'}

## Recent Deployment History (Last 5)
${recentDeployments.map((d, i) => `${i + 1}. ${d.status} - ${d.environment} - ${d.buildDuration || 'N/A'}s - ${new Date(d.createdAt).toLocaleDateString()}`).join('\n')}

**Recent Failure Rate**: ${failureRate.toFixed(1)}%

## Error Logs (Last 10)
${errorLogs.slice(0, 10).map((log: any) => `- [${log.level}] ${log.message}`).join('\n') || 'No error logs'}

## Warning Logs (Last 10)
${warningLogs.slice(0, 10).map((log: any) => `- [${log.level}] ${log.message}`).join('\n') || 'No warning logs'}

## Recent Events
${deployment.events?.slice(0, 10).map((event: any) => `- ${event.type}: ${event.message}`).join('\n') || 'No events'}

## Platform
- **Platform**: ${deployment.site?.connection?.platform || 'Unknown'}
- **Framework**: ${deployment.site?.framework || 'Unknown'}

Please analyze this deployment and provide:
1. A risk score (0-100, where 0 is no risk and 100 is critical risk)
2. List of specific risk factors identified
3. A brief summary of the deployment health
4. Actionable suggestions for improvement or risk mitigation
`;
  }

  /**
   * Perform AI analysis using OpenAI
   */
  private async performAIAnalysis(context: string): Promise<DeploymentRiskAnalysis> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert DevOps AI assistant specializing in deployment risk analysis. Analyze deployment data and provide structured risk assessments. Be concise but thorough. Focus on actionable insights.

Your response MUST be valid JSON in this exact format:
{
  "riskScore": <number 0-100>,
  "riskFactors": ["factor1", "factor2", ...],
  "aiSummary": "brief summary",
  "aiSuggestions": ["suggestion1", "suggestion2", ...]
}

Risk Score Guidelines:
- 0-20: Low risk (healthy deployment)
- 21-40: Moderate risk (minor issues)
- 41-60: Elevated risk (attention needed)
- 61-80: High risk (immediate action recommended)
- 81-100: Critical risk (deployment failure or severe issues)`,
          },
          {
            role: 'user',
            content: context,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      const analysis = JSON.parse(responseText);

      // Validate response structure
      if (
        typeof analysis.riskScore !== 'number' ||
        !Array.isArray(analysis.riskFactors) ||
        typeof analysis.aiSummary !== 'string' ||
        !Array.isArray(analysis.aiSuggestions)
      ) {
        throw new Error('Invalid response structure from OpenAI');
      }

      // Ensure risk score is within bounds
      analysis.riskScore = Math.max(0, Math.min(100, analysis.riskScore));

      return analysis;
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      
      // Fallback to rule-based analysis if AI fails
      return this.fallbackAnalysis(context);
    }
  }

  /**
   * Fallback rule-based analysis if AI fails
   */
  private fallbackAnalysis(context: string): DeploymentRiskAnalysis {
    const riskFactors: string[] = [];
    let riskScore = 0;

    // Check for errors
    if (context.includes('ERROR') || context.includes('Error Message:') && !context.includes('Error Message: None')) {
      riskFactors.push('Deployment contains errors');
      riskScore += 40;
    }

    // Check for warnings
    if (context.includes('[warn]')) {
      riskFactors.push('Warning logs detected');
      riskScore += 15;
    }

    // Check failure rate
    const failureRateMatch = context.match(/Recent Failure Rate: ([\d.]+)%/);
    if (failureRateMatch) {
      const failureRate = parseFloat(failureRateMatch[1]);
      if (failureRate > 50) {
        riskFactors.push(`High failure rate: ${failureRate.toFixed(1)}%`);
        riskScore += 30;
      } else if (failureRate > 20) {
        riskFactors.push(`Elevated failure rate: ${failureRate.toFixed(1)}%`);
        riskScore += 15;
      }
    }

    // Check status
    if (context.includes('Status: ERROR')) {
      riskFactors.push('Deployment failed');
      riskScore += 50;
    } else if (context.includes('Status: BUILDING') || context.includes('Status: DEPLOYING')) {
      riskFactors.push('Deployment in progress');
      riskScore += 10;
    }

    // Cap at 100
    riskScore = Math.min(100, riskScore);

    if (riskFactors.length === 0) {
      riskFactors.push('No significant risk factors detected');
    }

    return {
      riskScore,
      riskFactors,
      aiSummary: riskScore > 60
        ? 'This deployment shows elevated risk factors that require attention.'
        : riskScore > 30
        ? 'This deployment has some minor issues but appears stable.'
        : 'This deployment appears healthy with no major concerns.',
      aiSuggestions: riskScore > 60
        ? ['Review error logs immediately', 'Consider rolling back', 'Check recent changes']
        : riskScore > 30
        ? ['Monitor deployment closely', 'Review warning logs', 'Verify functionality']
        : ['Continue monitoring', 'Document successful deployment'],
    };
  }

  /**
   * Analyze deployment on status change
   */
  async analyzeOnStatusChange(deploymentId: string, newStatus: string): Promise<void> {
    // Only analyze on completion or error
    if (newStatus === 'READY' || newStatus === 'ERROR') {
      try {
        await this.analyzeDeployment(deploymentId);
      } catch (error) {
        console.error('Failed to analyze deployment on status change:', error);
        // Don't throw - analysis failure shouldn't block deployment updates
      }
    }
  }
}

export const aiDeploymentGuardian = new AIDeploymentGuardianService();
