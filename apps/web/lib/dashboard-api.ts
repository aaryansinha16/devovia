import { getTokens } from "./auth";
import { API_URL } from "./config";

export interface DashboardStats {
  overview: {
    projects: {
      total: number;
      active: number;
      thisWeek: number;
      change: number;
    };
    snippets: {
      total: number;
      public: number;
      thisWeek: number;
      change: number;
    };
    runbooks: {
      total: number;
      active: number;
      thisWeek: number;
      change: number;
    };
    deployments: {
      total: number;
      active: number;
      thisWeek: number;
      change: number;
    };
    blogs: {
      total: number;
      published: number;
      thisWeek: number;
      change: number;
    };
    sessions: {
      total: number;
      active: number;
      thisWeek: number;
    };
    engagement: {
      likes: number;
      comments: number;
      likesThisWeek: number;
      commentsThisWeek: number;
    };
    team: {
      memberships: number;
      teamProjects: number;
    };
  };
  breakdown: {
    projectsByStatus: Array<{ status: string; count: number }>;
    snippetsByLanguage: Array<{ language: string; count: number }>;
    runbooksByStatus: Array<{ status: string; count: number }>;
  };
  recent: {
    projects: Array<{
      id: string;
      title: string;
      description: string;
      status: string;
      visibility: string;
      techStack: string[];
      thumbnail: string | null;
      updatedAt: string;
      createdAt: string;
      _count: {
        members: number;
        likes: number;
        comments: number;
      };
    }>;
    snippets: Array<{
      id: string;
      title: string;
      language: string;
      tags: string[];
      isPublic: boolean;
      createdAt: string;
      _count: {
        likes: number;
        comments: number;
      };
    }>;
    runbookExecutions: Array<{
      id: string;
      status: string;
      startedAt: string;
      completedAt: string | null;
      runbook: {
        id: string;
        name: string;
        environment: string;
      };
    }>;
    deployments: Array<{
      id: string;
      name: string;
      platform: string;
      status: string;
      url: string | null;
      updatedAt: string;
    }>;
    blogs: Array<{
      id: string;
      title: string;
      slug: string;
      excerpt: string | null;
      published: boolean;
      coverImage: string | null;
      createdAt: string;
      updatedAt: string;
      _count: {
        likes: number;
        comments: number;
      };
    }>;
    sessions: Array<{
      id: string;
      name: string;
      language: string;
      status: string;
      isPublic: boolean;
      updatedAt: string;
      _count: {
        permissions: number;
      };
    }>;
  };
}

export interface DashboardActivity {
  id: string;
  type: 'project' | 'snippet' | 'blog' | 'runbook' | 'deployment';
  title: string;
  action: string;
  timestamp: string;
}

/**
 * Fetch dashboard statistics
 */
export async function fetchDashboardStats(): Promise<{ data: DashboardStats }> {
  const tokens = getTokens();

  if (!tokens) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/dashboard/stats`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.accessToken}`,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || "Failed to fetch dashboard stats");
  }

  return response.json();
}

/**
 * Fetch dashboard activity timeline
 */
export async function fetchDashboardActivity(limit: number = 20): Promise<{ data: DashboardActivity[] }> {
  const tokens = getTokens();

  if (!tokens) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/dashboard/activity?limit=${limit}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.accessToken}`,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || "Failed to fetch dashboard activity");
  }

  return response.json();
}
