'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  IconArrowLeft,
  IconExternalLink,
  IconGitBranch,
  IconClock,
  IconCheck,
  IconX,
  IconLoader2,
  IconRefresh,
  IconGitCommit,
  IconUser,
  IconCalendar,
  IconWorld,
  IconAlertTriangle,
  IconShield,
  IconUsers,
  IconRobot,
  IconFileText,
  IconArrowBackUp,
  IconPlayerPlay,
  IconTerminal2,
  IconSearch,
  IconFilter,
} from '@tabler/icons-react';
import { Button, Badge, GlassCard, Input } from '@repo/ui';
import { useToast } from '@repo/ui/hooks/use-toast';
import {
  getDeployment,
  getDeploymentLogs,
  syncDeploymentLogs,
  rollbackDeployment,
  createDeploymentSession,
  analyzeDeploymentRisk,
  getStatusBgColor,
  getPlatformIcon,
  getPlatformName,
  formatBuildDuration,
  getEnvironmentBadgeColor,
  type Deployment,
  type DeploymentLog,
  type DeploymentStatus,
} from '../../../../../lib/services/deployment-service';
import { useDeploymentLogs } from '../../../../../lib/hooks/use-deployment-logs';

// Status icon component
function StatusIcon({ status }: { status: DeploymentStatus }) {
  switch (status) {
    case 'READY':
      return <IconCheck className="h-4 w-4" />;
    case 'BUILDING':
    case 'DEPLOYING':
    case 'QUEUED':
      return <IconLoader2 className="h-4 w-4 animate-spin" />;
    case 'ERROR':
      return <IconX className="h-4 w-4" />;
    default:
      return <IconClock className="h-4 w-4" />;
  }
}

// Log level badge colors
function getLogLevelColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'error':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'warn':
    case 'warning':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'info':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'debug':
      return 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30';
    default:
      return 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30';
  }
}

// Risk score color
function getRiskScoreColor(score: number): string {
  if (score >= 70) return 'text-red-500';
  if (score >= 40) return 'text-yellow-500';
  return 'text-green-500';
}

// Tab type
type TabType = 'overview' | 'logs' | 'collaboration' | 'ai' | 'safety';

export default function DeploymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const deploymentId = params.id as string;

  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [logSearch, setLogSearch] = useState('');
  const [logLevelFilter, setLogLevelFilter] = useState<string>('all');
  const [rollingBack, setRollingBack] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [analyzingRisk, setAnalyzingRisk] = useState(false);
  const [syncingLogs, setSyncingLogs] = useState(false);

  // Real-time logs via WebSocket
  const { logs: realtimeLogs, isConnected: wsConnected } = useDeploymentLogs({
    deploymentId,
    enabled: activeTab === 'logs',
  });

  useEffect(() => {
    async function fetchDeployment() {
      try {
        setLoading(true);
        const response = await getDeployment(deploymentId);
        if (response.success && response.data) {
          setDeployment(response.data);
        }
      } catch (error) {
        console.error('Error fetching deployment:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDeployment();
  }, [deploymentId]);

  useEffect(() => {
    async function fetchLogs() {
      if (activeTab !== 'logs') return;
      
      try {
        setLogsLoading(true);
        const response = await getDeploymentLogs(deploymentId);
        if (response.success && response.data) {
          setLogs(response.data);
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setLogsLoading(false);
      }
    }

    fetchLogs();
  }, [deploymentId, activeTab]);

  // Merge fetched logs with real-time logs
  const allLogs = [...logs, ...realtimeLogs].sort((a, b) => {
    return (a.sequence || 0) - (b.sequence || 0);
  });

  const handleRollback = async () => {
    if (!deployment?.canRollback) {
      toast({
        title: 'Cannot Rollback',
        description: 'This deployment cannot be rolled back',
      });
      return;
    }

    if (!confirm('Are you sure you want to rollback to the previous deployment?')) {
      return;
    }

    try {
      setRollingBack(true);
      const response = await rollbackDeployment(deploymentId);
      if (response.success) {
        toast({
          title: 'Rollback Initiated',
          description: 'Rolling back to the previous deployment',
        });
        // Refresh deployment data
        window.location.reload();
      } else {
        toast({
          title: 'Rollback Failed',
          description: response.error?.message || 'Failed to initiate rollback',
        });
      }
    } catch (error) {
      console.error('Error rolling back:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    } finally {
      setRollingBack(false);
    }
  };

  const handleAnalyzeRisk = async () => {
    try {
      setAnalyzingRisk(true);
      const response = await analyzeDeploymentRisk(deploymentId);
      if (response.success && response.data) {
        toast({
          title: 'Analysis Complete',
          description: 'AI risk analysis has been updated',
        });
        // Update deployment with new AI data
        setDeployment((prev) => prev ? {
          ...prev,
          riskScore: response.data!.riskScore,
          riskFactors: response.data!.riskFactors,
          aiSummary: response.data!.aiSummary,
          aiSuggestions: response.data!.aiSuggestions,
        } : null);
      } else {
        toast({
          title: 'Analysis Failed',
          description: response.error?.message || 'Failed to analyze deployment',
        });
      }
    } catch (error) {
      console.error('Error analyzing deployment:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    } finally {
      setAnalyzingRisk(false);
    }
  };

  const handleSyncLogs = async () => {
    try {
      setSyncingLogs(true);
      const response = await syncDeploymentLogs(deploymentId);
      if (response && 'synced' in response) {
        toast({
          title: 'Logs Synced',
          description: `Synced ${response.synced || 0} logs from Vercel`,
        });
        // Refresh logs
        const logsResponse = await getDeploymentLogs(deploymentId);
        if (logsResponse.success && logsResponse.data) {
          setLogs(logsResponse.data);
        }
      } else {
        toast({
          title: 'Sync Failed',
          description: 'Failed to sync logs',
        });
      }
    } catch (error) {
      console.error('Error syncing logs:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    } finally {
      setSyncingLogs(false);
    }
  };

  const filteredLogs = allLogs.filter((log) => {
    const matchesSearch = logSearch === '' || 
      log.message.toLowerCase().includes(logSearch.toLowerCase());
    const matchesLevel = logLevelFilter === 'all' || log.level === logLevelFilter;
    return matchesSearch && matchesLevel;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <IconLoader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-white mb-2">Deployment Not Found</h2>
          <p className="text-neutral-400 mb-4">
            The deployment you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link href="/dashboard/deployments">
            <Button>Back to Deployments</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/deployments/${deployment.siteId}`}
          className="inline-flex items-center text-neutral-400 hover:text-white mb-4"
        >
          <IconArrowLeft className="h-4 w-4 mr-2" />
          Back to Site
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Badge className={`${getStatusBgColor(deployment.status)} border px-3 py-1`}>
              <StatusIcon status={deployment.status} />
              <span className="ml-2 capitalize">{deployment.status.toLowerCase()}</span>
            </Badge>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                {deployment.site?.name || 'Deployment'}
                <Badge className={`${getEnvironmentBadgeColor(deployment.environment)} border text-xs`}>
                  {deployment.environment}
                </Badge>
              </h1>
              <p className="text-neutral-400 mt-1 flex items-center gap-2">
                <IconGitBranch className="h-4 w-4" />
                {deployment.gitBranch || 'main'}
                {deployment.gitCommitSha && (
                  <span className="font-mono text-sm">
                    ({deployment.gitCommitSha.substring(0, 7)})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <IconRefresh className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {deployment.deploymentUrl && (
              <a href={deployment.deploymentUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <IconExternalLink className="h-4 w-4 mr-2" />
                  Visit
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-neutral-900 p-1 rounded-lg mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <IconFileText className="h-4 w-4" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'logs'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <IconTerminal2 className="h-4 w-4" />
          Logs
        </button>
        <button
          onClick={() => setActiveTab('collaboration')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'collaboration'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <IconUsers className="h-4 w-4" />
          Collaboration
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'ai'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <IconRobot className="h-4 w-4" />
          AI Insights
        </button>
        <button
          onClick={() => setActiveTab('safety')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'safety'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <IconShield className="h-4 w-4" />
          Safety
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Commit Info */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Commit Details</h3>
              <div className="space-y-4">
                {deployment.gitCommitMessage && (
                  <div>
                    <div className="text-sm text-neutral-400 mb-1">Commit Message</div>
                    <p className="text-white">{deployment.gitCommitMessage}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-neutral-400 mb-1">Branch</div>
                    <div className="text-white flex items-center gap-2">
                      <IconGitBranch className="h-4 w-4 text-neutral-500" />
                      {deployment.gitBranch || 'main'}
                    </div>
                  </div>
                  {deployment.gitCommitSha && (
                    <div>
                      <div className="text-sm text-neutral-400 mb-1">Commit SHA</div>
                      <div className="text-white font-mono text-sm">
                        {deployment.gitCommitSha}
                      </div>
                    </div>
                  )}
                  {deployment.gitAuthor && (
                    <div>
                      <div className="text-sm text-neutral-400 mb-1">Author</div>
                      <div className="text-white flex items-center gap-2">
                        <IconUser className="h-4 w-4 text-neutral-500" />
                        {deployment.gitAuthor}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-neutral-400 mb-1">Triggered By</div>
                    <div className="text-white">
                      {deployment.triggeredByName || deployment.triggerType || 'Unknown'}
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Build Info */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Build Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-neutral-400 mb-1">Status</div>
                  <Badge className={`${getStatusBgColor(deployment.status)} border`}>
                    <StatusIcon status={deployment.status} />
                    <span className="ml-1 capitalize">{deployment.status.toLowerCase()}</span>
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-neutral-400 mb-1">Duration</div>
                  <div className="text-white flex items-center gap-2">
                    <IconClock className="h-4 w-4 text-neutral-500" />
                    {deployment.buildDuration 
                      ? formatBuildDuration(deployment.buildDuration)
                      : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-neutral-400 mb-1">Started</div>
                  <div className="text-white text-sm">
                    {deployment.startedAt ? formatDate(deployment.startedAt) : 'Not started'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-neutral-400 mb-1">Finished</div>
                  <div className="text-white text-sm">
                    {deployment.finishedAt ? formatDate(deployment.finishedAt) : 'In progress'}
                  </div>
                </div>
              </div>

              {deployment.status === 'ERROR' && deployment.errorMessage && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <IconAlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                    <div>
                      <div className="text-red-400 font-medium">Error</div>
                      <p className="text-red-300 text-sm mt-1">{deployment.errorMessage}</p>
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {deployment.deploymentUrl && (
                  <a
                    href={deployment.deploymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button variant="outline" className="w-full justify-start">
                      <IconWorld className="h-4 w-4 mr-2" />
                      Visit Deployment
                    </Button>
                  </a>
                )}
                {deployment.inspectUrl && (
                  <a
                    href={deployment.inspectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button variant="outline" className="w-full justify-start">
                      <IconExternalLink className="h-4 w-4 mr-2" />
                      View on Platform
                    </Button>
                  </a>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setActiveTab('logs')}
                >
                  <IconTerminal2 className="h-4 w-4 mr-2" />
                  View Logs
                </Button>
              </div>
            </GlassCard>

            {/* Timestamps */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <div>
                    <div className="text-sm text-white">Queued</div>
                    <div className="text-xs text-neutral-400">
                      {formatDate(deployment.queuedAt || deployment.createdAt)}
                    </div>
                  </div>
                </div>
                {deployment.startedAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <div>
                      <div className="text-sm text-white">Started</div>
                      <div className="text-xs text-neutral-400">
                        {formatDate(deployment.startedAt)}
                      </div>
                    </div>
                  </div>
                )}
                {deployment.finishedAt && (
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      deployment.status === 'READY' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <div className="text-sm text-white">
                        {deployment.status === 'READY' ? 'Completed' : 'Failed'}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {formatDate(deployment.finishedAt)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Log Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search logs..."
                value={logSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLogSearch(e.target.value)}
                className="pl-9 bg-neutral-900 border-neutral-800"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'error', 'warn', 'info', 'debug'].map((level) => (
                <button
                  key={level}
                  onClick={() => setLogLevelFilter(level)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    logLevelFilter === level
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
            {/* Sync Logs Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSyncLogs}
              disabled={syncingLogs}
            >
              <IconRefresh className={`h-4 w-4 mr-2 ${syncingLogs ? 'animate-spin' : ''}`} />
              {syncingLogs ? 'Syncing...' : 'Sync Logs'}
            </Button>
            {/* WebSocket Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-900 border border-neutral-800">
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-neutral-400">
                {wsConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Logs */}
          <GlassCard className="p-4">
            {logsLoading ? (
              <div className="flex items-center justify-center py-12">
                <IconLoader2 className="h-6 w-6 animate-spin text-neutral-400" />
              </div>
            ) : filteredLogs.length > 0 ? (
              <div className="font-mono text-sm space-y-1 max-h-[600px] overflow-y-auto">
                {filteredLogs.map((log, index) => (
                  <div
                    key={log.id || index}
                    className={`flex items-start gap-3 p-2 rounded hover:bg-neutral-800/50 ${
                      log.level === 'error' ? 'bg-red-500/5' : ''
                    }`}
                  >
                    <span className="text-neutral-500 text-xs whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <Badge className={`${getLogLevelColor(log.level)} border text-xs px-1.5 py-0`}>
                      {log.level.toUpperCase()}
                    </Badge>
                    <span className={`flex-1 ${log.level === 'error' ? 'text-red-400' : 'text-neutral-300'}`}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <IconTerminal2 className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-500">No logs available</p>
                <p className="text-sm text-neutral-600 mt-1">
                  Logs will appear here once the deployment starts
                </p>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {activeTab === 'collaboration' && (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <IconUsers className="h-6 w-6 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Deployment War Room</h3>
            </div>
            
            {deployment.sessionId ? (
              <div className="space-y-4">
                <p className="text-neutral-400">
                  A collaborative session is active for this deployment. Join to discuss and monitor together.
                </p>
                <Link href={`/dashboard/sessions/${deployment.sessionId}`}>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <IconUsers className="h-4 w-4 mr-2" />
                    Join Session
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <IconUsers className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-500 mb-4">No active session for this deployment</p>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      setCreatingSession(true);
                      const response = await createDeploymentSession(deploymentId);
                      if (response.success && response.data) {
                        toast({
                          title: 'Session Created',
                          description: 'Collaborative session is ready',
                        });
                        // Refresh deployment data to get the session ID
                        window.location.reload();
                      } else {
                        toast({
                          title: 'Error',
                          description: response.error?.message || 'Failed to create session',
                        });
                      }
                    } catch (error) {
                      toast({
                        title: 'Error',
                        description: 'An unexpected error occurred',
                      });
                    } finally {
                      setCreatingSession(false);
                    }
                  }}
                  disabled={creatingSession}
                >
                  {creatingSession ? (
                    <>
                      <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <IconPlayerPlay className="h-4 w-4 mr-2" />
                      Start Collaborative Session
                    </>
                  )}
                </Button>
                <p className="text-sm text-neutral-600 mt-4">
                  Create a session to invite team members, discuss the deployment, and make decisions together.
                </p>
              </div>
            )}
          </GlassCard>

          {/* Participants would go here */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Activity</h3>
            <div className="text-center py-8 text-neutral-500">
              <p>Deployment activity and comments will appear here</p>
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="space-y-6">
          {/* Risk Score */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <IconRobot className="h-6 w-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">AI Risk Assessment</h3>
              </div>
              {deployment.riskScore !== undefined && deployment.riskScore !== null && (
                <div className={`text-3xl font-bold ${getRiskScoreColor(deployment.riskScore)}`}>
                  {deployment.riskScore}/100
                </div>
              )}
            </div>

            {deployment.riskScore !== undefined && deployment.riskScore !== null ? (
              <div className="space-y-4">
                {/* Risk Bar */}
                <div className="w-full bg-neutral-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      deployment.riskScore >= 70
                        ? 'bg-red-500'
                        : deployment.riskScore >= 40
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${deployment.riskScore}%` }}
                  />
                </div>

                {/* Risk Factors */}
                {deployment.riskFactors && Array.isArray(deployment.riskFactors) && (
                  <div>
                    <h4 className="text-sm font-medium text-neutral-400 mb-2">Risk Factors</h4>
                    <ul className="space-y-2">
                      {deployment.riskFactors.map((factor, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-neutral-300">
                          <IconAlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                          <div>
                            <span className="font-medium">{factor.category}</span>
                            {' - '}
                            <span>{factor.description}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Re-analyze Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyzeRisk}
                  disabled={analyzingRisk}
                  className="w-full"
                >
                  {analyzingRisk ? (
                    <>
                      <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <IconRobot className="h-4 w-4 mr-2" />
                      Re-analyze with AI
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <IconRobot className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-500 mb-4">AI analysis not yet performed</p>
                <Button
                  variant="default"
                  onClick={handleAnalyzeRisk}
                  disabled={analyzingRisk}
                >
                  {analyzingRisk ? (
                    <>
                      <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <IconRobot className="h-4 w-4 mr-2" />
                      Analyze with AI
                    </>
                  )}
                </Button>
                <p className="text-sm text-neutral-600 mt-4">
                  AI will analyze deployment logs, events, and history to provide risk assessment
                </p>
              </div>
            )}
          </GlassCard>

          {/* AI Summary */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">AI Summary</h3>
            {deployment.aiSummary ? (
              <p className="text-neutral-300">{deployment.aiSummary}</p>
            ) : (
              <p className="text-neutral-500">No AI summary available for this deployment.</p>
            )}
          </GlassCard>

          {/* AI Suggestions */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">AI Suggestions</h3>
            {deployment.aiSuggestions && Array.isArray(deployment.aiSuggestions) && deployment.aiSuggestions.length > 0 ? (
              <ul className="space-y-3">
                {deployment.aiSuggestions.map((suggestion: string, index: number) => (
                  <li key={index} className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <IconRobot className="h-5 w-5 text-blue-400 mt-0.5" />
                    <span className="text-neutral-300">{suggestion}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-neutral-500">No suggestions available.</p>
            )}
          </GlassCard>
        </div>
      )}

      {activeTab === 'safety' && (
        <div className="space-y-6">
          {/* Rollback */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <IconArrowBackUp className="h-6 w-6 text-orange-400" />
              <h3 className="text-lg font-semibold text-white">Rollback</h3>
            </div>
            
            {deployment.canRollback ? (
              <div className="space-y-4">
                <p className="text-neutral-400">
                  Roll back to the previous successful deployment. This will redeploy the previous version.
                </p>
                <Button
                  variant="outline"
                  className="text-orange-400 border-orange-400/50 hover:bg-orange-400/10"
                  onClick={handleRollback}
                  disabled={rollingBack}
                >
                  {rollingBack ? (
                    <>
                      <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                      Rolling back...
                    </>
                  ) : (
                    <>
                      <IconArrowBackUp className="h-4 w-4 mr-2" />
                      Rollback to Previous
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-neutral-500">
                  {deployment.isRollback 
                    ? 'This is already a rollback deployment'
                    : 'No previous deployment available for rollback'}
                </p>
              </div>
            )}
          </GlassCard>

          {/* Health Checks */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <IconShield className="h-6 w-6 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Health Checks</h3>
            </div>
            <div className="text-center py-8">
              <IconShield className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-500">Health check monitoring coming soon</p>
              <p className="text-sm text-neutral-600 mt-1">
                Configure health checks to monitor your deployment's status
              </p>
            </div>
          </GlassCard>

          {/* Deployment Info */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Deployment Safety Info</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Is Rollback</span>
                <Badge variant={deployment.isRollback ? 'default' : 'secondary'}>
                  {deployment.isRollback ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Can Rollback</span>
                <Badge variant={deployment.canRollback ? 'default' : 'secondary'}>
                  {deployment.canRollback ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Trigger Type</span>
                <Badge variant="secondary">{deployment.triggerType || 'push'}</Badge>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
