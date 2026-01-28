import { API_URL } from "../api-config";
import { getAuthHeaders } from "./auth-service";
import {
  apiRequest,
  apiRequestPaginated,
  apiRequestPaginatedPublic,
  apiRequestPublic,
  buildQueryString,
  PaginatedResult,
} from "../utils/api-client";

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
  tags: string[];
  user?: {
    id: string;
    name?: string;
    username: string;
    avatar?: string;
  };
  _count?: {
    comments: number;
    likes: number;
  };
}

export type BlogListResponse = PaginatedResult<BlogPost>;

export interface BlogFormData {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string | null;
  published: boolean;
  tags: string[];
}

/**
 * Get all published blog posts with optional filtering
 */
export async function getPublishedBlogs(
  page = 1,
  limit = 10,
  tag?: string,
  search?: string,
): Promise<BlogListResponse> {
  const query = buildQueryString({ page, limit, tag, search });
  return apiRequestPaginatedPublic<BlogPost>(`/blogs${query}`);
}

/**
 * Get a single blog post by slug
 */
export async function getBlogBySlug(slug: string): Promise<BlogPost> {
  const response = await apiRequestPublic<{ post: BlogPost }>(`/blogs/slug/${slug}`);
  return response.post;
}

/**
 * Get a single blog post by ID
 */
export async function getBlogById(id: string): Promise<BlogPost> {
  const response = await apiRequest<{ post: BlogPost }>(`/blogs/${id}`);
  return response.post;
}

/**
 * Get all blogs for the current authenticated user (including drafts)
 */
export async function getUserBlogs(): Promise<BlogListResponse> {
  return apiRequestPaginated<BlogPost>(`/blogs/user`);
}

/**
 * Create a new blog post
 */
export async function createBlog(blogData: BlogFormData): Promise<BlogPost> {
  return apiRequest<BlogPost>('/blogs', {
    method: 'POST',
    body: blogData,
  });
}

/**
 * Update an existing blog post
 */
export async function updateBlog(
  id: string,
  blogData: Partial<BlogFormData>,
): Promise<BlogPost> {
  return apiRequest<BlogPost>(`/blogs/${id}`, {
    method: 'PUT',
    body: blogData,
  });
}

/**
 * Delete a blog post
 */
export async function deleteBlog(id: string): Promise<void> {
  return apiRequest<void>(`/blogs/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Upload an image for a blog post
 */
export async function uploadBlogImage(imageFile: File): Promise<{
  imageUrl: string;
  success: boolean;
  width?: number;
  height?: number;
  format?: string;
}> {
  const headers = await getAuthHeaders();

  // Remove Content-Type as it will be set automatically with the correct boundary
  const { "Content-Type": _, ...authHeaders } = headers;

  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await fetch(`${API_URL}/blogs/upload-image`, {
    method: "POST",
    headers: authHeaders,
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image");
  }

  return response.json();
}
