'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  IconArrowLeft,
  IconCheck,
  IconExternalLink,
  IconLoader2,
  IconLock,
  IconAlertCircle,
} from '@tabler/icons-react';
import { Button, Input, Label, GlassCard } from '@repo/ui';
import { useToast } from '@repo/ui/hooks/use-toast';
import {
  createConnection,
  type DeploymentPlatform,
  getPlatformIcon,
  getPlatformName,
} from '../../../../lib/services/deployment-service';

interface PlatformConfig {
  platform: DeploymentPlatform;
  description: string;
  authType: 'oauth' | 'token';
  tokenLabel?: string;
  tokenPlaceholder?: string;
  docsUrl?: string;
  comingSoon?: boolean;
}

const platforms: PlatformConfig[] = [
  {
    platform: 'VERCEL',
    description: 'Deploy frontend applications with zero configuration',
    authType: 'token',
    tokenLabel: 'Vercel Access Token',
    tokenPlaceholder: 'Enter your Vercel access token',
    docsUrl: 'https://vercel.com/docs/rest-api#creating-an-access-token',
  },
  {
    platform: 'NETLIFY',
    description: 'Build, deploy, and manage modern web projects',
    authType: 'token',
    tokenLabel: 'Netlify Personal Access Token',
    tokenPlaceholder: 'Enter your Netlify personal access token',
    docsUrl: 'https://docs.netlify.com/api/get-started/#authentication',
  },
  {
    platform: 'RAILWAY',
    description: 'Infrastructure platform for deploying any code',
    authType: 'token',
    tokenLabel: 'Railway API Token',
    tokenPlaceholder: 'Enter your Railway API token',
    docsUrl: 'https://docs.railway.app/reference/public-api#authentication',
  },
  {
    platform: 'RENDER',
    description: 'Cloud platform for building and running apps',
    authType: 'token',
    tokenLabel: 'Render API Key',
    tokenPlaceholder: 'Enter your Render API key',
    docsUrl: 'https://render.com/docs/api#authentication',
  },
  {
    platform: 'FLY_IO',
    description: 'Deploy app servers close to your users',
    authType: 'token',
    tokenLabel: 'Fly.io Access Token',
    tokenPlaceholder: 'Enter your Fly.io access token',
    docsUrl: 'https://fly.io/docs/flyctl/tokens/',
    comingSoon: true,
  },
  {
    platform: 'CLOUDFLARE_PAGES',
    description: 'JAMstack platform for frontend developers',
    authType: 'token',
    tokenLabel: 'Cloudflare API Token',
    tokenPlaceholder: 'Enter your Cloudflare API token',
    docsUrl: 'https://developers.cloudflare.com/fundamentals/api/get-started/create-token/',
    comingSoon: true,
  },
  {
    platform: 'AWS_AMPLIFY',
    description: 'Build full-stack web and mobile apps',
    authType: 'token',
    tokenLabel: 'AWS Access Key',
    tokenPlaceholder: 'Enter your AWS access key',
    docsUrl: 'https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html',
    comingSoon: true,
  },
  {
    platform: 'GITHUB_PAGES',
    description: 'Host static websites directly from GitHub',
    authType: 'token',
    tokenLabel: 'GitHub Personal Access Token',
    tokenPlaceholder: 'Enter your GitHub PAT',
    docsUrl: 'https://docs.github.com/en/pages',
    comingSoon: true,
  },
];

export default function ConnectPlatformPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformConfig | null>(null);
  const [connectionName, setConnectionName] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!selectedPlatform || !accessToken || !connectionName) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await createConnection({
        platform: selectedPlatform.platform,
        platformName: connectionName,
        accessToken,
      });

      if (response.success) {
        toast({
          title: 'Platform Connected',
          description: `Successfully connected to ${getPlatformName(selectedPlatform.platform)}`,
        });
        router.push('/dashboard/deployments');
      } else {
        toast({
          title: 'Connection Failed',
          description: response.error?.message || 'Failed to connect platform',
        });
      }
    } catch (error) {
      console.error('Error connecting platform:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/deployments"
          className="inline-flex items-center text-neutral-400 hover:text-white mb-4"
        >
          <IconArrowLeft className="h-4 w-4 mr-2" />
          Back to Deployments
        </Link>
        <h1 className="text-3xl font-bold text-white">Connect Platform</h1>
        <p className="text-neutral-400 mt-1">
          Connect your deployment platform to track and manage deployments
        </p>
      </div>

      {!selectedPlatform ? (
        /* Platform Selection */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map((config) => (
            <div
              key={config.platform}
              className={`p-6 rounded-xl border border-neutral-800 bg-neutral-900/50 cursor-pointer transition-all ${
                config.comingSoon
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:border-blue-500/50 hover:bg-neutral-900'
              }`}
              onClick={() => !config.comingSoon && setSelectedPlatform(config)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{getPlatformIcon(config.platform)}</div>
                  <div>
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      {getPlatformName(config.platform)}
                      {config.comingSoon && (
                        <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded">
                          Coming Soon
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-neutral-400 mt-1">{config.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Connection Form */
        <GlassCard className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="text-3xl">{getPlatformIcon(selectedPlatform.platform)}</div>
            <div>
              <h2 className="text-xl font-semibold text-white">Connect to {getPlatformName(selectedPlatform.platform)}</h2>
              <p className="text-sm text-neutral-400">{selectedPlatform.description}</p>
            </div>
          </div>
          <div className="space-y-6">
            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <IconLock className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-400 font-medium">Secure Connection</p>
                  <p className="text-sm text-neutral-400 mt-1">
                    Your access token is encrypted and stored securely. We only use it to fetch
                    deployment information and never share it with third parties.
                  </p>
                </div>
              </div>
            </div>

            {/* Connection Name */}
            <div className="space-y-2">
              <Label htmlFor="connectionName">Connection Name</Label>
              <Input
                id="connectionName"
                placeholder={`My ${getPlatformName(selectedPlatform.platform)} Account`}
                value={connectionName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConnectionName(e.target.value)}
                className="bg-neutral-800 border-neutral-700"
              />
              <p className="text-xs text-neutral-500">
                A friendly name to identify this connection
              </p>
            </div>

            {/* Access Token */}
            <div className="space-y-2">
              <Label htmlFor="accessToken">{selectedPlatform.tokenLabel}</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder={selectedPlatform.tokenPlaceholder}
                value={accessToken}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccessToken(e.target.value)}
                className="bg-neutral-800 border-neutral-700"
              />
              {selectedPlatform.docsUrl && (
                <a
                  href={selectedPlatform.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <IconExternalLink className="h-3 w-3" />
                  How to get your access token
                </a>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
              <Button variant="ghost" onClick={() => setSelectedPlatform(null)}>
                <IconArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleConnect}
                disabled={loading || !accessToken || !connectionName}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <IconCheck className="h-4 w-4 mr-2" />
                    Connect Platform
                  </>
                )}
              </Button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Help Section */}
      <GlassCard className="p-6 mt-8">
          <div className="flex items-start gap-4">
            <IconAlertCircle className="h-6 w-6 text-yellow-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white">Need Help?</h3>
              <p className="text-sm text-neutral-400 mt-1">
                If you're having trouble connecting your platform, check out our{' '}
                <a href="#" className="text-blue-400 hover:text-blue-300">
                  documentation
                </a>{' '}
                or{' '}
                <a href="#" className="text-blue-400 hover:text-blue-300">
                  contact support
                </a>
                .
              </p>
            </div>
          </div>
      </GlassCard>
    </div>
  );
}
