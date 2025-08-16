// Import apiClient only in client components
import { apiClient } from "../api-client";

// API URL for server components
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  tags: Array<String>;
  _count?: {
    comments: number;
    likes: number;
  };
}

export interface BlogPagination {
  posts: BlogPost[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Helper function for fetching data that works on both server and client
 */
async function fetchFromApi(
  endpoint: string,
  options?: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: any;
    headers?: Record<string, string>;
  },
) {
  const isServer = typeof window === "undefined";
  const method = options?.method || "GET";

  if (isServer) {
    // Server-side fetch
    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    };

    if (options?.body && (method === "POST" || method === "PUT")) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, fetchOptions);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    if (method === "DELETE" && response.status === 204) {
      return;
    }

    return response.json();
  } else {
    // Client-side: use axios
    let response;

    switch (method) {
      case "POST":
        response = await apiClient.post(endpoint, options?.body);
        break;
      case "PUT":
        response = await apiClient.put(endpoint, options?.body);
        break;
      case "DELETE":
        response = await apiClient.delete(endpoint);
        break;
      default: // GET
        response = await apiClient.get(endpoint);
    }

    return response.data;
  }
}

/**
 * Fetch all published blog posts with pagination
 */
export async function getAllPublishedBlogs(
  page: number = 1,
  limit: number = 10,
  tag?: string,
): Promise<BlogPagination> {
  try {
    let url = `/blogs?page=${page}&limit=${limit}`;
    if (tag) {
      url += `&tag=${encodeURIComponent(tag)}`;
    }

    return await fetchFromApi(url);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    throw error;
  }
}

/**
 * Fetch a single blog post by its slug
 */
export async function getBlogBySlug(slug: string): Promise<BlogPost> {
  try {
    console.log(`Attempting to fetch blog with slug: ${slug}`);
    const response = await fetchFromApi(`/blogs/slug/${slug}`);
    console.log("Blog fetch response:", response);

    // The API returns { post: BlogPost }, but we need to return just the post
    if (response && response.post) {
      return response.post;
    }

    // If we get here, the API response is not in the expected format
    throw new Error(`Invalid API response format for slug: ${slug}`);
  } catch (error) {
    console.error(`Error fetching blog with slug ${slug}:`, error);
    throw error;
  }
}

/**
 * Like a blog post
 */
export async function likeBlog(postId: string): Promise<{ likeCount: number }> {
  try {
    return await fetchFromApi(`/blogs/${postId}/like`, { method: "POST" });
  } catch (error) {
    console.error(`Error liking blog ${postId}:`, error);
    throw error;
  }
}

/**
 * Unlike a blog post
 */
export async function unlikeBlog(
  postId: string,
): Promise<{ likeCount: number }> {
  try {
    return await fetchFromApi(`/blogs/${postId}/like`, { method: "DELETE" });
  } catch (error) {
    console.error(`Error unliking blog ${postId}:`, error);
    throw error;
  }
}

/**
 * Check if the current user has liked a blog post
 */
export async function checkUserLike(
  postId: string,
): Promise<{ isLiked: boolean; likeCount: number }> {
  try {
    return await fetchFromApi(`/blogs/${postId}/like`);
  } catch (error) {
    console.error(`Error checking like status for blog ${postId}:`, error);
    // Return default values if there's an error (e.g. user is not authenticated)
    return { isLiked: false, likeCount: 0 };
  }
}

/**
 * Get all comments for a blog post
 */
export interface CommentResponse {
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
      username: string;
      avatar?: string;
    };
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export async function getBlogComments(
  postId: string,
  page: number = 1,
  limit: number = 10,
): Promise<CommentResponse> {
  try {
    return await fetchFromApi(
      `/blogs/${postId}/comments?page=${page}&limit=${limit}`,
    );
  } catch (error) {
    console.error(`Error fetching comments for blog ${postId}:`, error);
    throw error;
  }
}

/**
 * Add a comment to a blog post
 */
export async function addBlogComment(
  postId: string,
  content: string,
): Promise<any> {
  try {
    return await fetchFromApi(`/blogs/${postId}/comments`, {
      method: "POST",
      body: { content },
    });
  } catch (error) {
    console.error(`Error adding comment to blog ${postId}:`, error);
    throw error;
  }
}

/**
 * Delete a comment
 */
export async function deleteBlogComment(commentId: string): Promise<void> {
  try {
    await fetchFromApi(`/comments/${commentId}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error(`Error deleting comment ${commentId}:`, error);
    throw error;
  }
}
