'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  IconArrowLeft,
  IconTrendingUp,
  IconTrendingDown,
  IconClock,
  IconAlertTriangle,
  IconRocket,
  IconRefresh,
  IconCalendar,
  IconChartBar,
} from '@tabler/icons-react';
import { Button, GlassCard, Container, Heading, Text, BackgroundDecorative } from '@repo/ui';
import { getDashboardStats } from '../../../../lib/services/deployment-service';

interface DORAMetrics {
  deploymentFrequency: {
    value: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    rating: 'elite' | 'high' | 'medium' | 'low';
  };
  leadTime: {
    value: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    rating: 'elite' | 'high' | 'medium' | 'low';
  };
  changeFailureRate: {
    value: number;
    trend: 'up' | 'down' | 'stable';
    rating: 'elite' | 'high' | 'medium' | 'low';
  };
  mttr: {
    value: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    rating: 'elite' | 'high' | 'medium' | 'low';
  };
}

function getRatingColor(rating: string): string {
  switch (rating) {
    case 'elite':
      return 'text-green-500';
    case 'high':
      return 'text-blue-500';
    case 'medium':
      return 'text-yellow-500';
    case 'low':
      return 'text-red-500';
    default:
      return 'text-neutral-500';
  }
}

function getRatingBadgeColor(rating: string): string {
  switch (rating) {
    case 'elite':
      return 'bg-emerald-500/20 text-emerald-300 shadow-sm shadow-emerald-500/20';
    case 'high':
      return 'bg-sky-500/20 text-sky-300 shadow-sm shadow-sky-500/20';
    case 'medium':
      return 'bg-amber-500/20 text-amber-300 shadow-sm shadow-amber-500/20';
    case 'low':
      return 'bg-rose-500/20 text-rose-300 shadow-sm shadow-rose-500/20';
    default:
      return 'bg-slate-500/20 text-slate-300 shadow-sm shadow-slate-500/20';
  }
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <IconTrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === 'down') return <IconTrendingDown className="h-4 w-4 text-red-500" />;
  return <div className="h-4 w-4" />;
}

export default function DORAMetricsPage() {
  const [metrics, setMetrics] = useState<DORAMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        // Fetch dashboard stats and calculate DORA metrics
        const response = await getDashboardStats();
        
        if (response.success && response.data) {
          const stats = response.data;
          
          // Calculate DORA metrics from stats
          // Deployment Frequency: deployments per day
          const deploymentsPerDay = stats.totalDeployments / 30; // Assuming 30 days
          let dfRating: 'elite' | 'high' | 'medium' | 'low' = 'low';
          if (deploymentsPerDay >= 1) dfRating = 'elite'; // Multiple per day
          else if (deploymentsPerDay >= 0.14) dfRating = 'high'; // Weekly
          else if (deploymentsPerDay >= 0.03) dfRating = 'medium'; // Monthly
          
          // Lead Time: Average time from commit to deploy (mock data for now)
          const leadTimeHours = 24; // TODO: Calculate from actual data
          let ltRating: 'elite' | 'high' | 'medium' | 'low' = 'low';
          if (leadTimeHours < 1) ltRating = 'elite';
          else if (leadTimeHours < 24) ltRating = 'high';
          else if (leadTimeHours < 168) ltRating = 'medium';
          
          // Change Failure Rate
          const cfr = stats.totalDeployments > 0 
            ? (stats.failedDeployments / stats.totalDeployments) * 100 
            : 0;
          let cfrRating: 'elite' | 'high' | 'medium' | 'low' = 'low';
          if (cfr < 5) cfrRating = 'elite';
          else if (cfr < 10) cfrRating = 'high';
          else if (cfr < 15) cfrRating = 'medium';
          
          // MTTR: Mean time to recovery (mock data for now)
          const mttrHours = 2; // TODO: Calculate from actual data
          let mttrRating: 'elite' | 'high' | 'medium' | 'low' = 'low';
          if (mttrHours < 1) mttrRating = 'elite';
          else if (mttrHours < 24) mttrRating = 'high';
          else if (mttrHours < 168) mttrRating = 'medium';
          
          setMetrics({
            deploymentFrequency: {
              value: deploymentsPerDay,
              unit: 'per day',
              trend: 'up',
              rating: dfRating,
            },
            leadTime: {
              value: leadTimeHours,
              unit: 'hours',
              trend: 'down',
              rating: ltRating,
            },
            changeFailureRate: {
              value: cfr,
              trend: 'down',
              rating: cfrRating,
            },
            mttr: {
              value: mttrHours,
              unit: 'hours',
              trend: 'stable',
              rating: mttrRating,
            },
          });
        }
      } catch (error) {
        console.error('Error fetching DORA metrics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [timeRange]);

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

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <Heading size="h1" variant="gradient" spacing="sm">
                DORA Metrics
              </Heading>
              <Text variant="muted">
                DevOps Research and Assessment metrics for deployment performance
              </Text>
            </div>
            <div className="flex items-center gap-3">
              {/* Time Range Selector */}
              <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                {(['7d', '30d', '90d'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      timeRange === range
                        ? 'bg-sky-500 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <IconRefresh className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : metrics ? (
        <>
          {/* DORA Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Deployment Frequency */}
            <GlassCard className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <IconRocket className="h-6 w-6 text-blue-400" />
                </div>
                <TrendIcon trend={metrics.deploymentFrequency.trend} />
              </div>
              <h3 className="text-sm font-medium text-neutral-400 mb-2">
                Deployment Frequency
              </h3>
              <div className="flex items-baseline gap-2 mb-3">
                <span className={`text-3xl font-bold ${getRatingColor(metrics.deploymentFrequency.rating)}`}>
                  {metrics.deploymentFrequency.value.toFixed(1)}
                </span>
                <span className="text-sm text-neutral-500">
                  {metrics.deploymentFrequency.unit}
                </span>
              </div>
              <div className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold ${getRatingBadgeColor(metrics.deploymentFrequency.rating)}`}>
                {metrics.deploymentFrequency.rating.toUpperCase()}
              </div>
            </GlassCard>

            {/* Lead Time for Changes */}
            <GlassCard className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <IconClock className="h-6 w-6 text-green-400" />
                </div>
                <TrendIcon trend={metrics.leadTime.trend} />
              </div>
              <h3 className="text-sm font-medium text-neutral-400 mb-2">
                Lead Time for Changes
              </h3>
              <div className="flex items-baseline gap-2 mb-3">
                <span className={`text-3xl font-bold ${getRatingColor(metrics.leadTime.rating)}`}>
                  {metrics.leadTime.value.toFixed(1)}
                </span>
                <span className="text-sm text-neutral-500">
                  {metrics.leadTime.unit}
                </span>
              </div>
              <div className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold ${getRatingBadgeColor(metrics.leadTime.rating)}`}>
                {metrics.leadTime.rating.toUpperCase()}
              </div>
            </GlassCard>

            {/* Change Failure Rate */}
            <GlassCard className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <IconAlertTriangle className="h-6 w-6 text-yellow-400" />
                </div>
                <TrendIcon trend={metrics.changeFailureRate.trend} />
              </div>
              <h3 className="text-sm font-medium text-neutral-400 mb-2">
                Change Failure Rate
              </h3>
              <div className="flex items-baseline gap-2 mb-3">
                <span className={`text-3xl font-bold ${getRatingColor(metrics.changeFailureRate.rating)}`}>
                  {metrics.changeFailureRate.value.toFixed(1)}
                </span>
                <span className="text-sm text-neutral-500">%</span>
              </div>
              <div className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold ${getRatingBadgeColor(metrics.changeFailureRate.rating)}`}>
                {metrics.changeFailureRate.rating.toUpperCase()}
              </div>
            </GlassCard>

            {/* Mean Time to Recovery */}
            <GlassCard className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <IconRefresh className="h-6 w-6 text-purple-400" />
                </div>
                <TrendIcon trend={metrics.mttr.trend} />
              </div>
              <h3 className="text-sm font-medium text-neutral-400 mb-2">
                Mean Time to Recovery
              </h3>
              <div className="flex items-baseline gap-2 mb-3">
                <span className={`text-3xl font-bold ${getRatingColor(metrics.mttr.rating)}`}>
                  {metrics.mttr.value.toFixed(1)}
                </span>
                <span className="text-sm text-neutral-500">
                  {metrics.mttr.unit}
                </span>
              </div>
              <div className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold ${getRatingBadgeColor(metrics.mttr.rating)}`}>
                {metrics.mttr.rating.toUpperCase()}
              </div>
            </GlassCard>
          </div>

          {/* DORA Performance Level */}
          <GlassCard className="p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Overall Performance</h2>
            <div className="space-y-4">
              <p className="text-neutral-300">
                Your team's deployment performance is being tracked across four key DORA metrics.
                These metrics help identify areas for improvement and measure DevOps maturity.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlassCard className="p-5">
                  <h3 className="text-sm font-semibold text-white mb-3">Elite Performers</h3>
                  <ul className="text-sm text-slate-400 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Deploy multiple times per day
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Lead time less than 1 hour
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Change failure rate below 5%
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      MTTR less than 1 hour
                    </li>
                  </ul>
                </GlassCard>
                <GlassCard className="p-5">
                  <h3 className="text-sm font-semibold text-white mb-3">High Performers</h3>
                  <ul className="text-sm text-slate-400 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                      Deploy weekly or more
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                      Lead time less than 1 day
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                      Change failure rate 5-10%
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                      MTTR less than 1 day
                    </li>
                  </ul>
                </GlassCard>
              </div>
            </div>
          </GlassCard>

          {/* Recommendations */}
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Recommendations</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-sky-500/10 rounded-lg">
                <IconRocket className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">
                    Increase Deployment Frequency
                  </h4>
                  <p className="text-sm text-neutral-400">
                    Consider implementing continuous deployment to automatically deploy changes after successful tests.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-emerald-500/10 rounded-lg">
                <IconClock className="h-5 w-5 text-green-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">
                    Reduce Lead Time
                  </h4>
                  <p className="text-sm text-neutral-400">
                    Optimize your CI/CD pipeline and reduce manual approval steps to speed up deployments.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-lg">
                <IconAlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">
                    Improve Testing
                  </h4>
                  <p className="text-sm text-neutral-400">
                    Enhance automated testing coverage to catch issues before deployment and reduce failure rates.
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-neutral-500">No metrics data available</p>
        </div>
      )}
      </Container>
    </div>
  );
}
