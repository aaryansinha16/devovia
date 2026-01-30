/**
 * Platform Integration Service
 * Handles actual API integrations with deployment platforms (Vercel, Netlify, Railway, etc.)
 */

import axios, { AxiosInstance } from 'axios';
import prisma from '../lib/prisma';

const db = prisma as any;

interface PlatformConfig {
  baseUrl: string;
  headers: (token: string) => Record<string, string>;
}

const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  VERCEL: {
    baseUrl: 'https://api.vercel.com',
    headers: (token: string) => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
  },
  NETLIFY: {
    baseUrl: 'https://api.netlify.com/api/v1',
    headers: (token: string) => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
  },
  RAILWAY: {
    baseUrl: 'https://backboard.railway.app/graphql',
    headers: (token: string) => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
  },
  RENDER: {
    baseUrl: 'https://api.render.com/v1',
    headers: (token: string) => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
  },
};

export class PlatformIntegrationService {
  /**
   * Trigger a deployment on a platform
   */
  async triggerDeployment(
    siteId: string,
    options: { branch?: string; environment?: string } = {}
  ): Promise<{ success: boolean; platformDeploymentId?: string; error?: string }> {
    try {
      const site = await db.deploymentSite.findUnique({
        where: { id: siteId },
        include: { connection: true },
      });

      if (!site || !site.connection) {
        return { success: false, error: 'Site or connection not found' };
      }

      const platform = site.connection.platform;

      switch (platform) {
        case 'VERCEL':
          return await this.triggerVercelDeployment(site, options);
        case 'NETLIFY':
          return await this.triggerNetlifyDeployment(site, options);
        case 'RAILWAY':
          return await this.triggerRailwayDeployment(site, options);
        case 'RENDER':
          return await this.triggerRenderDeployment(site, options);
        default:
          return { success: false, error: `Platform ${platform} not supported for manual triggers` };
      }
    } catch (error: any) {
      console.error('Error triggering deployment:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Trigger Vercel deployment
   * Automatically creates and uses deploy hooks for reliability
   */
  private async triggerVercelDeployment(
    site: any,
    options: { branch?: string }
  ): Promise<{ success: boolean; platformDeploymentId?: string; error?: string }> {
    try {
      const config = PLATFORM_CONFIGS.VERCEL;
      const client = axios.create({
        baseURL: config.baseUrl,
        headers: config.headers(site.connection.accessToken),
      });

      // Check if we already have a deploy hook for this site
      let deployHookUrl = site.deployHookUrl;

      if (!deployHookUrl) {
        // First, try to get existing deploy hooks
        try {
          const existingHooksResponse = await client.get(`/v1/projects/${site.platformSiteId}/deploy-hooks`);
          const existingHooks = existingHooksResponse.data;

          // Check if there's an existing hook we can use
          if (existingHooks && existingHooks.length > 0) {
            // Use the first available hook
            deployHookUrl = existingHooks[0].url;
            
            // Save it to the site
            await db.deploymentSite.update({
              where: { id: site.id },
              data: { deployHookUrl },
            });

            console.log(`Using existing deploy hook for site ${site.name}`);
          }
        } catch (listError: any) {
          console.log('Could not list existing deploy hooks, will try to create new one');
        }

        // If no existing hook found, create a new one
        if (!deployHookUrl) {
          try {
            const hookResponse = await client.post(`/v1/projects/${site.platformSiteId}/deploy-hooks`, {
              name: 'Devovia Auto Deploy',
              ref: options.branch || site.repoBranch || 'main',
            });

            console.log('Deploy hook creation response - checking link.deployHooks');

            // Vercel returns the entire project object with deployHooks in link.deployHooks array
            const deployHooks = hookResponse.data.link?.deployHooks;
            
            if (deployHooks && deployHooks.length > 0) {
              // Use the most recently created hook (last in array)
              const latestHook = deployHooks[deployHooks.length - 1];
              deployHookUrl = latestHook.url;
              console.log(`Using deploy hook: ${latestHook.name} - ${deployHookUrl}`);
            }

            if (!deployHookUrl) {
              console.error('Deploy hook created but URL not found in response');
              return {
                success: false,
                error: 'Deploy hook was created but URL was not found. Please check Vercel project settings.',
              };
            }
          } catch (hookError: any) {
            console.error('Failed to create deploy hook:', hookError.response?.data || hookError.message);
            
            // If we can't create a hook, return a helpful error with instructions
            return {
              success: false,
              error: 'Unable to automatically create deploy hook. Please create one manually in Vercel project settings (Settings → Git → Deploy Hooks) and the system will use it automatically on next deployment.',
            };
          }
        }
      }

      // Validate deploy hook URL before using it
      if (!deployHookUrl || !deployHookUrl.startsWith('http')) {
        return {
          success: false,
          error: 'Invalid deploy hook URL. Please create a deploy hook manually in Vercel project settings.',
        };
      }

      // Trigger deployment using the deploy hook
      const response = await axios.post(deployHookUrl);

      console.log('Deploy hook triggered successfully');

      // Deploy hooks don't return a deployment ID immediately
      // The deployment will be created by Vercel and can be synced later
      return {
        success: true,
        platformDeploymentId: undefined, // Will be populated by sync
      };
    } catch (error: any) {
      console.error('Vercel deployment error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || 'Failed to trigger deployment',
      };
    }
  }

  /**
   * Trigger Netlify deployment
   */
  private async triggerNetlifyDeployment(
    site: any,
    options: { branch?: string }
  ): Promise<{ success: boolean; platformDeploymentId?: string; error?: string }> {
    try {
      const config = PLATFORM_CONFIGS.NETLIFY;
      const client = axios.create({
        baseURL: config.baseUrl,
        headers: config.headers(site.connection.accessToken),
      });

      // Trigger build hook or create deployment
      const response = await client.post(`/sites/${site.platformSiteId}/builds`, {
        clear_cache: false,
        branch: options.branch || site.repoBranch,
      });

      return {
        success: true,
        platformDeploymentId: response.data.id,
      };
    } catch (error: any) {
      console.error('Netlify deployment error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Trigger Railway deployment
   */
  private async triggerRailwayDeployment(
    site: any,
    options: { branch?: string }
  ): Promise<{ success: boolean; platformDeploymentId?: string; error?: string }> {
    try {
      const config = PLATFORM_CONFIGS.RAILWAY;
      const client = axios.create({
        baseURL: config.baseUrl,
        headers: config.headers(site.connection.accessToken),
      });

      // Railway uses GraphQL
      const query = `
        mutation deploymentCreate($input: DeploymentCreateInput!) {
          deploymentCreate(input: $input) {
            id
          }
        }
      `;

      const response = await client.post('', {
        query,
        variables: {
          input: {
            projectId: site.platformSiteId,
            environmentId: site.metadata?.environmentId,
          },
        },
      });

      return {
        success: true,
        platformDeploymentId: response.data.data.deploymentCreate.id,
      };
    } catch (error: any) {
      console.error('Railway deployment error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.message || error.message,
      };
    }
  }

  /**
   * Trigger Render deployment
   */
  private async triggerRenderDeployment(
    site: any,
    options: { branch?: string }
  ): Promise<{ success: boolean; platformDeploymentId?: string; error?: string }> {
    try {
      const config = PLATFORM_CONFIGS.RENDER;
      const client = axios.create({
        baseURL: config.baseUrl,
        headers: config.headers(site.connection.accessToken),
      });

      // Trigger manual deploy
      const response = await client.post(`/services/${site.platformSiteId}/deploys`, {
        clearCache: 'do_not_clear',
      });

      return {
        success: true,
        platformDeploymentId: response.data.id,
      };
    } catch (error: any) {
      console.error('Render deployment error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Get deployment status from platform
   */
  async getDeploymentStatus(
    deploymentId: string
  ): Promise<{ status: string; url?: string; error?: string }> {
    try {
      const deployment = await db.deployment.findUnique({
        where: { id: deploymentId },
        include: {
          site: {
            include: { connection: true },
          },
        },
      });

      if (!deployment || !deployment.site?.connection) {
        return { status: 'UNKNOWN', error: 'Deployment or connection not found' };
      }

      const platform = deployment.site.connection.platform;

      switch (platform) {
        case 'VERCEL':
          return await this.getVercelDeploymentStatus(deployment);
        case 'NETLIFY':
          return await this.getNetlifyDeploymentStatus(deployment);
        case 'RAILWAY':
          return await this.getRailwayDeploymentStatus(deployment);
        case 'RENDER':
          return await this.getRenderDeploymentStatus(deployment);
        default:
          return { status: deployment.status };
      }
    } catch (error: any) {
      console.error('Error getting deployment status:', error);
      return { status: 'UNKNOWN', error: error.message };
    }
  }

  private async getVercelDeploymentStatus(deployment: any): Promise<{ status: string; url?: string }> {
    const config = PLATFORM_CONFIGS.VERCEL;
    const client = axios.create({
      baseURL: config.baseUrl,
      headers: config.headers(deployment.site.connection.accessToken),
    });

    const response = await client.get(`/v13/deployments/${deployment.platformDeploymentId}`);
    const vercelStatus = response.data.readyState;

    const statusMap: Record<string, string> = {
      QUEUED: 'QUEUED',
      BUILDING: 'BUILDING',
      READY: 'READY',
      ERROR: 'ERROR',
      CANCELED: 'CANCELLED',
    };

    return {
      status: statusMap[vercelStatus] || 'UNKNOWN',
      url: response.data.url,
    };
  }

  private async getNetlifyDeploymentStatus(deployment: any): Promise<{ status: string; url?: string }> {
    const config = PLATFORM_CONFIGS.NETLIFY;
    const client = axios.create({
      baseURL: config.baseUrl,
      headers: config.headers(deployment.site.connection.accessToken),
    });

    const response = await client.get(`/deploys/${deployment.platformDeploymentId}`);
    const netlifyState = response.data.state;

    const statusMap: Record<string, string> = {
      new: 'QUEUED',
      building: 'BUILDING',
      processing: 'DEPLOYING',
      ready: 'READY',
      error: 'ERROR',
    };

    return {
      status: statusMap[netlifyState] || 'UNKNOWN',
      url: response.data.deploy_ssl_url || response.data.url,
    };
  }

  private async getRailwayDeploymentStatus(deployment: any): Promise<{ status: string; url?: string }> {
    // Railway GraphQL query for deployment status
    const config = PLATFORM_CONFIGS.RAILWAY;
    const client = axios.create({
      baseURL: config.baseUrl,
      headers: config.headers(deployment.site.connection.accessToken),
    });

    const query = `
      query deployment($id: String!) {
        deployment(id: $id) {
          status
          url
        }
      }
    `;

    const response = await client.post('', {
      query,
      variables: { id: deployment.platformDeploymentId },
    });

    const railwayStatus = response.data.data.deployment.status;

    const statusMap: Record<string, string> = {
      QUEUED: 'QUEUED',
      BUILDING: 'BUILDING',
      DEPLOYING: 'DEPLOYING',
      SUCCESS: 'READY',
      FAILED: 'ERROR',
      CRASHED: 'ERROR',
    };

    return {
      status: statusMap[railwayStatus] || 'UNKNOWN',
      url: response.data.data.deployment.url,
    };
  }

  private async getRenderDeploymentStatus(deployment: any): Promise<{ status: string; url?: string }> {
    const config = PLATFORM_CONFIGS.RENDER;
    const client = axios.create({
      baseURL: config.baseUrl,
      headers: config.headers(deployment.site.connection.accessToken),
    });

    const response = await client.get(`/deploys/${deployment.platformDeploymentId}`);
    const renderStatus = response.data.status;

    const statusMap: Record<string, string> = {
      created: 'QUEUED',
      build_in_progress: 'BUILDING',
      update_in_progress: 'DEPLOYING',
      live: 'READY',
      build_failed: 'ERROR',
      update_failed: 'ERROR',
      canceled: 'CANCELLED',
    };

    return {
      status: statusMap[renderStatus] || 'UNKNOWN',
      url: response.data.service?.serviceDetails?.url,
    };
  }
}

export const platformIntegrationService = new PlatformIntegrationService();
