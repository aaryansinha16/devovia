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
  IconSettings,
  IconTrash,
  IconRocket,
  IconGitCommit,
  IconUser,
  IconCalendar,
  IconLink,
  IconWorld,
} from '@tabler/icons-react';
import { Button, Badge, GlassCard, Container, Heading, Text, BackgroundDecorative } from '@repo/ui';
import { useToast } from '@repo/ui/hooks/use-toast';
import {
  getSite,
  getDeployments,
  deleteSite,
  triggerDeployment,
  syncSiteDeployments,
  getStatusBgColor,
  getPlatformIcon,
  getPlatformName,
  formatBuildDuration,
  getEnvironmentBadgeColor,
  type DeploymentSite,
  type Deployment,
  type DeploymentStatus,
} from '../../../../lib/services/deployment-service';

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

// Deployment Card Component
function DeploymentCard({ deployment }: { deployment: Deployment }) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Link href={`/dashboard/deployments/deploy/${deployment.id}`}>
      <GlassCard className="p-4 hover:shadow-xl hover:shadow-sky-500/10 transition-all cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusBgColor(deployment.status)}`}>
              {deployment.status === 'READY' ? 'Ready' : deployment.status === 'BUILDING' ? 'Building' : deployment.status}
            </span>
            <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getEnvironmentBadgeColor(deployment.environment)}`}>
              {deployment.environment}
            </span>
          </div>
          <div className="text-xs text-slate-500">
            {formatDate(deployment.createdAt)}
          </div>
        </div>

        <div className="space-y-3">
          {/* Git Info */}
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-1 text-neutral-400">
              <IconGitBranch className="h-4 w-4" />
              <span>{deployment.gitBranch || 'main'}</span>
            </div>
            {deployment.gitCommitSha && (
              <div className="flex items-center gap-1 text-neutral-400">
                <IconGitCommit className="h-4 w-4" />
                <span className="font-mono">{deployment.gitCommitSha.substring(0, 7)}</span>
              </div>
            )}
            {deployment.buildDuration && (
              <div className="flex items-center gap-1 text-neutral-400">
                <IconClock className="h-4 w-4" />
                <span>{formatBuildDuration(deployment.buildDuration)}</span>
              </div>
            )}
          </div>

          {/* Commit Message */}
          {deployment.gitCommitMessage && (
            <p className="text-sm text-neutral-500 truncate">{deployment.gitCommitMessage}</p>
          )}

          {/* Author */}
          {deployment.gitAuthor && (
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <IconUser className="h-4 w-4" />
              <span>{deployment.gitAuthor}</span>
            </div>
          )}

          {/* Error Message */}
          {deployment.status === 'ERROR' && deployment.errorMessage && (
            <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
              {deployment.errorMessage}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-3 text-sm">
          {deployment.deploymentUrl && (
            <a
              href={deployment.deploymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              <IconExternalLink className="h-4 w-4" />
              Visit
            </a>
          )}
          {deployment.inspectUrl && (
            <a
              href={deployment.inspectUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-slate-400 hover:text-slate-300 flex items-center gap-1"
            >
              <IconSettings className="h-4 w-4" />
              Inspect
            </a>
          )}
        </div>
      </GlassCard>
    </Link>
  );
}

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const siteId = params.id as string;

  const [site, setSite] = useState<DeploymentSite | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [siteRes, deploymentsRes] = await Promise.all([
          getSite(siteId),
          getDeployments({ siteId, limit: 20 }),
        ]);

        if (siteRes.success && siteRes.data) {
          setSite(siteRes.data);
        }
        if (deploymentsRes.success && deploymentsRes.data) {
          setDeployments(deploymentsRes.data);
        }
      } catch (error) {
        console.error('Error fetching site data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load site details',
        });
      } finally {
        setLoading(false);
      }
    }

    if (siteId) {
      fetchData();
    }
  }, [siteId]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await deleteSite(siteId);
      if (response.success) {
        toast({
          title: 'Site Deleted',
          description: 'The site has been removed from your deployments',
        });
        router.push('/dashboard/deployments');
      } else {
        toast({
          title: 'Error',
          description: response.error?.message || 'Failed to delete site',
        });
      }
    } catch (error) {
      console.error('Error deleting site:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleTriggerDeployment = async () => {
    try {
      setTriggering(true);
      const response = await triggerDeployment(siteId, {
        branch: site?.repoBranch || 'main',
      });
      
      if (response.success) {
        toast({
          title: 'Deployment Triggered',
          description: `Deployment started for ${site?.repoBranch || 'main'} branch`,
        });
        // Refresh deployments list
        const deploymentsRes = await getDeployments({ siteId, limit: 20 });
        if (deploymentsRes.success && deploymentsRes.data) {
          setDeployments(deploymentsRes.data);
        }
      } else {
        toast({
          title: 'Error',
          description: response.error?.message || 'Failed to trigger deployment',
        });
      }
    } catch (error) {
      console.error('Error triggering deployment:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    } finally {
      setTriggering(false);
    }
  };

  const handleSyncDeployments = async () => {
    try {
      setSyncing(true);
      const response = await syncSiteDeployments(siteId, 20);
      
      if (response && 'synced' in response) {
        toast({
          title: 'Sync Complete',
          description: `Synced ${response.synced || 0} deployments from ${getPlatformName(site?.connection?.platform || 'CUSTOM')}`,
        });
        // Refresh deployments list
        const deploymentsRes = await getDeployments({ siteId, limit: 20 });
        if (deploymentsRes.success && deploymentsRes.data) {
          setDeployments(deploymentsRes.data);
        }
      } else {
        toast({
          title: 'Sync Failed',
          description: 'Failed to sync deployments',
        });
      }
    } catch (error) {
      console.error('Error syncing deployments:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <IconLoader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-white mb-2">Site Not Found</h2>
          <p className="text-neutral-400 mb-4">
            The site you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link href="/dashboard/deployments">
            <Button>Back to Deployments</Button>
          </Link>
        </div>
      </div>
    );
  }

  const latestDeployment = deployments[0];
  const successfulDeployments = deployments.filter((d) => d.status === 'READY').length;
  const failedDeployments = deployments.filter((d) => d.status === 'ERROR').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-28">
      <BackgroundDecorative />
      <Container className="py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/deployments"
            className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back to Deployments
          </Link>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="text-4xl">
                {getPlatformIcon(site.connection?.platform || 'CUSTOM')}
              </div>
              <div>
                <Heading size="h1" spacing="sm">{site.name}</Heading>
                <Text variant="muted">
                  {site.repoOwner}/{site.repoName} • {getPlatformName(site.connection?.platform || 'CUSTOM')}
                </Text>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="gradient"
                size="sm"
                onClick={handleTriggerDeployment}
                disabled={triggering}
                leftIcon={<IconRocket className="w-4 h-4" />}
              >
                {triggering ? 'Deploying...' : 'Deploy Now'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSyncDeployments}
                disabled={syncing}
              >
                <IconRefresh className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  if (confirm(`Are you sure you want to remove this site from Devovia? This will delete all deployment history.`)) {
                    handleDelete();
                  }
                }}
                disabled={deleting}
              >
                <IconTrash className="h-4 w-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <GlassCard className="p-4">
            <div className="text-2xl font-bold text-white mb-1">{deployments.length}</div>
            <div className="text-sm text-slate-400">Total Deployments</div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-2xl font-bold text-green-400 mb-1">{successfulDeployments}</div>
            <div className="text-sm text-slate-400">Successful</div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-2xl font-bold text-red-400 mb-1">{failedDeployments}</div>
            <div className="text-sm text-slate-400">Failed</div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-2xl font-bold text-white mb-1">
              {deployments.length > 0
                ? `${Math.round((successfulDeployments / deployments.length) * 100)}%`
                : '-'}
            </div>
            <div className="text-sm text-slate-400">Success Rate</div>
          </GlassCard>
        </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Site Info */}
        <div className="space-y-6">
          {/* Site Details */}
          <GlassCard className="p-6">
            <Heading size="h3" className="mb-4">Site Details</Heading>
            <div className="space-y-4">
              {/* Production URL */}
              {site.productionUrl && (
                <div>
                  <div className="text-sm text-neutral-400 mb-1">Production URL</div>
                  <a
                    href={site.productionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <IconWorld className="h-4 w-4" />
                    {site.productionUrl.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}

              {/* Repository */}
              {site.repoUrl && (
                <div>
                  <div className="text-sm text-neutral-400 mb-1">Repository</div>
                  <a
                    href={site.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <IconGitBranch className="h-4 w-4" />
                    {site.repoOwner}/{site.repoName}
                  </a>
                </div>
              )}

              {/* Branch */}
              <div>
                <div className="text-sm text-neutral-400 mb-1">Branch</div>
                <div className="text-white flex items-center gap-1">
                  <IconGitBranch className="h-4 w-4 text-neutral-500" />
                  {site.repoBranch || 'main'}
                </div>
              </div>

              {/* Framework */}
              {site.framework && (
                <div>
                  <div className="text-sm text-neutral-400 mb-1">Framework</div>
                  <div className="text-white capitalize">{site.framework}</div>
                </div>
              )}

              {/* Custom Domains */}
              {site.customDomains && site.customDomains.length > 0 && (
                <div>
                  <div className="text-sm text-neutral-400 mb-1">Custom Domains</div>
                  <div className="space-y-1">
                    {site.customDomains.map((domain: string) => (
                      <div key={domain} className="text-white flex items-center gap-1">
                        <IconLink className="h-4 w-4 text-neutral-500" />
                        {domain}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Created */}
              <div>
                <div className="text-sm text-neutral-400 mb-1">Added to Devovia</div>
                <div className="text-white flex items-center gap-1">
                  <IconCalendar className="h-4 w-4 text-neutral-500" />
                  {new Date(site.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Settings */}
          <GlassCard className="p-6">
            <Heading size="h3" className="mb-4">Settings</Heading>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Auto Deploy</span>
                <Badge variant={site.autoDeployEnabled ? 'default' : 'secondary'}>
                  {site.autoDeployEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Notifications</span>
                <Badge variant={site.notifyOnDeploy ? 'default' : 'secondary'}>
                  {site.notifyOnDeploy ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column - Deployments */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6">
            <Heading size="h3" className="mb-1">Deployment History</Heading>
            <Text variant="muted" className="mb-4">Recent deployments for this site</Text>
              {deployments.length > 0 ? (
                <div className="space-y-4">
                  {deployments.map((deployment) => (
                    <DeploymentCard key={deployment.id} deployment={deployment} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <IconRocket className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-500">No deployments yet</p>
                  <p className="text-sm text-neutral-600 mt-1">
                    Push to your repository to trigger a deployment
                  </p>
                </div>
              )}
          </GlassCard>
        </div>
      </div>
      </Container>
    </div>
  );
}
