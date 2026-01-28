// Import apiClient only in client components
import { apiClient } from "../api-client";
import { ApiPaginatedResponse, ApiResponse, PaginationMeta } from "../types/api.types";
import { extractData, extractPaginatedData } from "../utils/api-adapter";

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
  tags: Array<string>;
  _count?: {
    comments: number;
    likes: number;
  };
}

export type BlogPagination = ApiPaginatedResponse<BlogPost>;

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
  search?: string,
): Promise<BlogPagination> {
  try {
    let url = `/blogs?page=${page}&limit=${limit}`;
    if (tag) {
      url += `&tag=${encodeURIComponent(tag)}`;
    }
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
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
    const response: ApiResponse<{ post: BlogPost }> = await fetchFromApi(`/blogs/slug/${slug}`);
    return extractData(response).post;
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
    const response: ApiResponse<{ like: any; likeCount: number }> = await fetchFromApi(`/blogs/${postId}/like`, { method: "POST" });
    return { likeCount: extractData(response).likeCount };
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
    const response: ApiResponse<{ likeCount: number }> = await fetchFromApi(`/blogs/${postId}/like`, { method: "DELETE" });
    return extractData(response);
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
  isAuthenticated: boolean
): Promise<{ isLiked: boolean; likeCount: number }> {
  if (!isAuthenticated) {
    return { isLiked: false, likeCount: 0 };
  }
  try {
    const response: ApiResponse<{ isLiked: boolean; likeCount: number }> = await fetchFromApi(`/blogs/${postId}/like`);
    return extractData(response);
  } catch (error) {
    console.error(`Error checking like status for blog ${postId}:`, error);
    // Return default values if there's an error (e.g. user is not authenticated)
    return { isLiked: false, likeCount: 0 };
  }
}

/**
 * Get all comments for a blog post
 */
export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
}

export type CommentResponse = ApiPaginatedResponse<Comment>;

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
): Promise<Comment> {
  try {
    const response: ApiResponse<Comment> = await fetchFromApi(`/blogs/${postId}/comments`, {
      method: "POST",
      body: { content },
    });
    return extractData(response);
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
