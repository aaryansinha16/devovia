'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  IconRocket,
  IconPlus,
  IconRefresh,
  IconExternalLink,
  IconGitBranch,
  IconClock,
  IconCheck,
  IconX,
  IconLoader2,
  IconServer,
  IconChartBar,
  IconLink,
  IconSettings,
  IconSearch,
  IconFilter,
  IconCalendar,
  IconLayoutGrid,
  IconLayoutList,
} from '@tabler/icons-react';
import { Button, Badge, Input, GlassCard, Container, Heading, Text, BackgroundDecorative, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@repo/ui';
import { SyncSitesDialog } from '../../../components/deployment/sync-sites-dialog';
import {
  getDashboardStats,
  getSites,
  getDeployments,
  getStatusBgColor,
  getPlatformIcon,
  getPlatformName,
  formatBuildDuration,
  getEnvironmentBadgeColor,
  type DeploymentStats,
  type DeploymentSite,
  type Deployment,
  type DeploymentStatus,
  type DeploymentPlatform,
} from '../../../lib/services/deployment-service';

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

// Stats Card Component
function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-white/5 rounded-lg">
          <Icon className="h-5 w-5 text-slate-400" />
        </div>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-slate-400">{title}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
    </GlassCard>
  );
}

// Site Card Component
function SiteCard({ site }: { site: DeploymentSite }) {
  const latestDeploy = site.latestDeployment;

  return (
    <Link href={`/dashboard/deployments/${site.id}`}>
      <GlassCard className="p-6 hover:shadow-xl hover:shadow-sky-500/10 transition-all cursor-pointer group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{getPlatformIcon(site.connection?.platform || 'CUSTOM')}</div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-sky-400 transition-colors">{site.name}</h3>
              <p className="text-sm text-slate-400">
                {site.repoOwner}/{site.repoName}
              </p>
            </div>
          </div>
          {latestDeploy && (
            <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusBgColor(latestDeploy.status)}`}>
              {latestDeploy.status === 'READY' ? 'Ready' : latestDeploy.status === 'BUILDING' ? 'Building' : latestDeploy.status}
            </span>
          )}
        </div>

        {latestDeploy && (
          <div className="border-t border-white/5 pt-4">
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-1">
                <IconGitBranch className="h-4 w-4" />
                <span>{latestDeploy.gitBranch || 'main'}</span>
              </div>
              {latestDeploy.gitCommitSha && (
                <span className="font-mono text-xs">
                  {latestDeploy.gitCommitSha.substring(0, 7)}
                </span>
              )}
              {latestDeploy.buildDuration && (
                <div className="flex items-center gap-1">
                  <IconClock className="h-4 w-4" />
                  <span>{formatBuildDuration(latestDeploy.buildDuration)}</span>
                </div>
              )}
            </div>
            {latestDeploy.gitCommitMessage && (
              <p className="mt-2 text-sm text-neutral-500 truncate">
                {latestDeploy.gitCommitMessage}
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 text-sm">
          {site.productionUrl && (
            <a
              href={site.productionUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              <IconExternalLink className="h-4 w-4" />
              Visit
            </a>
          )}
        </div>
      </GlassCard>
    </Link>
  );
}

// Deployment Row Component
function DeploymentRow({ deployment }: { deployment: Deployment }) {
  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Link href={`/dashboard/deployments/deploy/${deployment.id}`}>
      <GlassCard className="p-5 hover:shadow-2xl hover:shadow-sky-500/20 transition-all cursor-pointer group">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-5 flex-1">
            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusBgColor(deployment.status)}`}>
              {deployment.status === 'READY' ? 'Ready' : deployment.status === 'BUILDING' ? 'Building' : deployment.status}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-semibold text-white group-hover:text-sky-400 transition-colors text-base truncate">
                  {deployment.site?.name || 'Unknown Site'}
                </span>
                <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getEnvironmentBadgeColor(deployment.environment)}`}>
                  {deployment.environment}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <IconGitBranch className="h-3.5 w-3.5" />
                  <span className="font-medium">{deployment.gitBranch || 'main'}</span>
                </span>
                {deployment.gitCommitSha && (
                  <span className="font-mono text-xs bg-slate-800/50 px-2 py-0.5 rounded">{deployment.gitCommitSha.substring(0, 7)}</span>
                )}
                <span className="text-slate-500">{timeAgo(deployment.createdAt)}</span>
              </div>
            </div>
          </div>
          {deployment.deploymentUrl && (
            <a
              href={deployment.deploymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-sky-400 hover:text-sky-300 flex items-center gap-1 flex-shrink-0"
            >
              <IconExternalLink className="h-5 w-5" />
            </a>
          )}
        </div>
      </GlassCard>
    </Link>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 bg-neutral-800/50 rounded-full mb-4">
        <IconRocket className="h-12 w-12 text-neutral-500" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">No deployments yet</h3>
      <p className="text-neutral-400 text-center max-w-md mb-6">
        Connect your deployment platforms like Vercel, Netlify, or Railway to track and manage all
        your deployments in one place.
      </p>
      <div className="flex gap-3">
        <Link href="/dashboard/deployments/connect">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <IconLink className="h-4 w-4 mr-2" />
            Connect Platform
          </Button>
        </Link>
        <Link href="/dashboard/deployments/import">
          <Button variant="outline">
            <IconPlus className="h-4 w-4 mr-2" />
            Import Site
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function DeploymentsPage() {
  const [stats, setStats] = useState<DeploymentStats | null>(null);
  const [sites, setSites] = useState<DeploymentSite[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  // View modes
  const [sitesViewMode, setSitesViewMode] = useState<'grid' | 'table'>('table');
  const [deploymentsViewMode, setDeploymentsViewMode] = useState<'grid' | 'table'>('table');
  // Filters
  const [statusFilter, setStatusFilter] = useState<DeploymentStatus | 'all'>('all');
  const [envFilter, setEnvFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [statsRes, sitesRes, deploymentsRes] = await Promise.all([
          getDashboardStats(),
          getSites({ limit: 100 }),
          getDeployments({ limit: 50 }),
        ]);

        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }
        if (sitesRes.success && sitesRes.data) {
          setSites(sitesRes.data);
        }
        if (deploymentsRes.success && deploymentsRes.data) {
          setDeployments(deploymentsRes.data);
        }
      } catch (error) {
        console.error('Error fetching deployment data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredSites = sites.filter(
    (site: DeploymentSite) =>
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.repoName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredSites.length / itemsPerPage);
  const paginatedSites = filteredSites.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredDeployments = deployments.filter((deploy: Deployment) => {
    const matchesStatus = statusFilter === 'all' || deploy.status === statusFilter;
    const matchesEnv = envFilter === 'all' || deploy.environment === envFilter;
    
    // Date range filter
    let matchesDate = true;
    if (dateFrom || dateTo) {
      const deployDate = new Date(deploy.createdAt);
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && deployDate >= fromDate;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && deployDate <= toDate;
      }
    }
    
    return matchesStatus && matchesEnv && matchesDate;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <IconLoader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  const hasData = stats && (stats.totalSites > 0 || sites.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-28">
      <BackgroundDecorative />
      <Container className="py-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <Heading size="h1" variant="gradient" spacing="sm">
              Deployments
            </Heading>
            <Text variant="muted">
              Track and manage your deployments across all platforms
            </Text>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/deployments/metrics">
              <Button variant="outline" size="sm">
                <IconChartBar className="h-4 w-4 mr-2" />
                DORA Metrics
              </Button>
            </Link>
            <SyncSitesDialog />
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <IconRefresh className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Link href="/dashboard/deployments/connect">
              <Button variant="gradient" size="md" leftIcon={<IconPlus className="w-5 h-5" />}>
                Connect Platform
              </Button>
            </Link>
          </div>
        </div>

      {!hasData ? (
        <EmptyState />
      ) : (
        <>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Total Sites"
            value={stats?.totalSites || 0}
            icon={IconServer}
            subtitle="Connected projects"
          />
          <StatsCard
            title="Total Deployments"
            value={stats?.totalDeployments || 0}
            icon={IconRocket}
            subtitle="All time"
          />
          <StatsCard
            title="Success Rate"
            value={
              stats?.totalDeployments
                ? `${Math.round((stats.successfulDeployments / stats.totalDeployments) * 100)}%`
                : '0%'
            }
            icon={IconCheck}
            subtitle={`${stats?.successfulDeployments || 0} successful`}
          />
          <StatsCard
            title="Avg Build Time"
            value={formatBuildDuration(stats?.averageBuildTime)}
            icon={IconClock}
            subtitle="Across all sites"
          />
        </div>

        {/* Filters & Tabs */}
        <GlassCard className="p-6 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-1 bg-white/5 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('sites')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'sites'
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sites ({sites.length})
              </button>
              <button
                onClick={() => setActiveTab('deployments')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'deployments'
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Recent Deployments
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search sites..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50"
                />
              </div>
              {/* View Mode Toggle */}
              {(activeTab === 'sites' || activeTab === 'deployments') && (
                <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                  <button
                    onClick={() => activeTab === 'sites' ? setSitesViewMode('table') : setDeploymentsViewMode('table')}
                    className={`p-2 rounded-lg transition-colors ${
                      (activeTab === 'sites' ? sitesViewMode : deploymentsViewMode) === 'table'
                        ? 'bg-sky-500 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Table view"
                  >
                    <IconLayoutList className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => activeTab === 'sites' ? setSitesViewMode('grid') : setDeploymentsViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${
                      (activeTab === 'sites' ? sitesViewMode : deploymentsViewMode) === 'grid'
                        ? 'bg-sky-500 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Grid view"
                  >
                    <IconLayoutGrid className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </GlassCard>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Deployments */}
                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-1">Recent Deployments</h3>
                  <p className="text-sm text-neutral-400 mb-4">Latest deployment activity</p>
                  <div className="space-y-4">
                    {stats?.recentDeployments && stats.recentDeployments.length > 0 ? (
                      stats.recentDeployments.slice(0, 5).map((deploy: Deployment) => (
                        <DeploymentRow key={deploy.id} deployment={deploy} />
                      ))
                    ) : (
                      <p className="text-neutral-500 text-center py-4">No recent deployments</p>
                    )}
                  </div>
                </GlassCard>

                {/* Platform Breakdown */}
                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-1">Connected Platforms</h3>
                  <p className="text-sm text-neutral-400 mb-4">Sites by platform</p>
                  {stats?.platformBreakdown && stats.platformBreakdown.length > 0 ? (
                    <div className="space-y-4">
                      {stats.platformBreakdown.map((item: { platform: DeploymentPlatform; count: number }) => (
                        <div
                          key={item.platform}
                          className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{getPlatformIcon(item.platform)}</span>
                            <span className="text-white">{getPlatformName(item.platform)}</span>
                          </div>
                          <Badge>{item.count} sites</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-neutral-500 mb-4">No platforms connected</p>
                      <Link href="/dashboard/deployments/connect">
                        <Button variant="outline">
                          <IconLink className="h-4 w-4 mr-2" />
                          Connect Platform
                        </Button>
                      </Link>
                    </div>
                  )}
                </GlassCard>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <GlassCard className="p-4">
                  <div className="text-2xl font-bold text-green-500">{stats?.deploymentsToday || 0}</div>
                  <div className="text-sm text-neutral-400">Deployments Today</div>
                </GlassCard>
                <GlassCard className="p-4">
                  <div className="text-2xl font-bold text-blue-500">{stats?.deploymentsThisWeek || 0}</div>
                  <div className="text-sm text-neutral-400">This Week</div>
                </GlassCard>
                <GlassCard className="p-4">
                  <div className="text-2xl font-bold text-green-500">{stats?.successfulDeployments || 0}</div>
                  <div className="text-sm text-neutral-400">Successful</div>
                </GlassCard>
                <GlassCard className="p-4">
                  <div className="text-2xl font-bold text-red-500">{stats?.failedDeployments || 0}</div>
                  <div className="text-sm text-neutral-400">Failed</div>
                </GlassCard>
              </div>
            </div>
          )}

        {/* Sites Tab */}
        {activeTab === 'sites' && (
          <>
            {filteredSites.length > 0 ? (
              <>
                {sitesViewMode === 'table' ? (
                  /* Table View */
                  <GlassCard className="overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Site</TableHead>
                          <TableHead>Platform</TableHead>
                          <TableHead>Repository</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Deploy</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedSites.map((site) => {
                          const latestDeploy = site.latestDeployment;
                          return (
                            <TableRow key={site.id} className="cursor-pointer" onClick={() => window.location.href = `/dashboard/deployments/${site.id}`}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="text-xl">{getPlatformIcon(site.connection?.platform || 'CUSTOM')}</div>
                                  <div>
                                    <div className="font-semibold text-white">{site.name}</div>
                                    <div className="text-xs text-slate-500">{site.framework || 'N/A'}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-slate-400">{getPlatformName(site.connection?.platform || 'CUSTOM')}</span>
                              </TableCell>
                              <TableCell>
                                <span className="text-slate-400 font-mono text-sm">{site.repoOwner}/{site.repoName}</span>
                              </TableCell>
                              <TableCell>
                                {latestDeploy ? (
                                  <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusBgColor(latestDeploy.status)}`}>
                                    {latestDeploy.status === 'READY' ? 'Ready' : latestDeploy.status === 'BUILDING' ? 'Building' : latestDeploy.status}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 text-sm">No deployments</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {latestDeploy ? (
                                  <span className="text-slate-400 text-sm">{new Date(latestDeploy.createdAt).toLocaleDateString()}</span>
                                ) : (
                                  <span className="text-slate-500 text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {site.productionUrl && (
                                  <a
                                    href={site.productionUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-sky-400 hover:text-sky-300 inline-flex items-center gap-1"
                                  >
                                    <IconExternalLink className="h-4 w-4" />
                                  </a>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </GlassCard>
                ) : (
                  /* Grid View */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedSites.map((site) => (
                      <SiteCard key={site.id} site={site} />
                    ))}
                  </div>
                )}
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-sky-500 text-white'
                              : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <GlassCard className="p-12 text-center">
                <IconRocket className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <Heading size="h3" className="mb-2">
                  No sites found
                </Heading>
                <Text className="text-slate-400">
                  {searchQuery ? 'No sites match your search' : 'No sites connected yet'}
                </Text>
              </GlassCard>
            )}
          </>
        )}

          {/* Deployments Tab */}
          {activeTab === 'deployments' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    showFilters ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <IconFilter className="h-4 w-4" />
                  Filters
                  {(statusFilter !== 'all' || envFilter !== 'all') && (
                    <span className="bg-blue-500 text-white text-xs px-1.5 rounded-full">
                      {(statusFilter !== 'all' ? 1 : 0) + (envFilter !== 'all' ? 1 : 0)}
                    </span>
                  )}
                </button>
                
                {showFilters && (
                  <>
                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-400">Status:</span>
                      <div className="flex gap-1">
                        {(['all', 'READY', 'BUILDING', 'ERROR', 'QUEUED'] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              statusFilter === status
                                ? status === 'all'
                                  ? 'bg-neutral-700 text-white'
                                  : status === 'READY'
                                  ? 'bg-green-500/20 text-green-400'
                                  : status === 'ERROR'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                          >
                            {status === 'all' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Environment Filter */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-400">Environment:</span>
                      <div className="flex gap-1">
                        {(['all', 'PRODUCTION', 'PREVIEW', 'STAGING', 'DEVELOPMENT'] as const).map((env) => (
                          <button
                            key={env}
                            onClick={() => setEnvFilter(env)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              envFilter === env
                                ? env === 'all'
                                  ? 'bg-neutral-700 text-white'
                                  : env === 'PRODUCTION'
                                  ? 'bg-green-500/20 text-green-400'
                                  : env === 'PREVIEW'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                          >
                            {env === 'all' ? 'All' : env.charAt(0) + env.slice(1).toLowerCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date Range Filter */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-400">Date:</span>
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="w-40 bg-neutral-800 border-neutral-700 text-white text-sm"
                          placeholder="From"
                        />
                        <span className="text-neutral-500">to</span>
                        <Input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="w-40 bg-neutral-800 border-neutral-700 text-white text-sm"
                          placeholder="To"
                        />
                      </div>
                    </div>

                    {/* Clear Filters */}
                    {(statusFilter !== 'all' || envFilter !== 'all' || dateFrom || dateTo) && (
                      <button
                        onClick={() => {
                          setStatusFilter('all');
                          setEnvFilter('all');
                          setDateFrom('');
                          setDateTo('');
                        }}
                        className="text-sm text-neutral-400 hover:text-white"
                      >
                        Clear filters
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Deployments List */}
              {filteredDeployments.length > 0 ? (
                deploymentsViewMode === 'table' ? (
                  /* Table View */
                  <GlassCard className="overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Site</TableHead>
                          <TableHead>Environment</TableHead>
                          <TableHead>Branch</TableHead>
                          <TableHead>Commit</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDeployments.map((deployment) => (
                          <TableRow key={deployment.id} className="cursor-pointer" onClick={() => window.location.href = `/dashboard/deployments/deploy/${deployment.id}`}>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusBgColor(deployment.status)}`}>
                                {deployment.status === 'READY' ? 'Ready' : deployment.status === 'BUILDING' ? 'Building' : deployment.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold text-white">{deployment.site?.name || 'Unknown Site'}</div>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getEnvironmentBadgeColor(deployment.environment)}`}>
                                {deployment.environment}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-slate-400 flex items-center gap-1">
                                <IconGitBranch className="h-3 w-3" />
                                {deployment.gitBranch || 'main'}
                              </span>
                            </TableCell>
                            <TableCell>
                              {deployment.gitCommitSha ? (
                                <span className="text-slate-400 font-mono text-xs">{deployment.gitCommitSha.substring(0, 7)}</span>
                              ) : (
                                <span className="text-slate-500 text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-slate-400 text-sm">{new Date(deployment.createdAt).toLocaleDateString()}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              {deployment.deploymentUrl && (
                                <a
                                  href={deployment.deploymentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-sky-400 hover:text-sky-300 inline-flex items-center gap-1"
                                >
                                  <IconExternalLink className="h-4 w-4" />
                                </a>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </GlassCard>
                ) : (
                  /* Grid View */
                  <div className="space-y-4">
                    {filteredDeployments.map((deployment) => (
                      <DeploymentRow key={deployment.id} deployment={deployment} />
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  <p className="text-neutral-500">
                    {statusFilter !== 'all' || envFilter !== 'all'
                      ? 'No deployments match your filters'
                      : 'No deployments yet'}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
      </Container>
    </div>
  );
}
