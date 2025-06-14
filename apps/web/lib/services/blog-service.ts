import { API_URL, buildUrl } from "../api-config";
import { getAuthHeaders } from "./auth-service";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string | null;
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

export interface BlogListResponse {
  posts: BlogPost[];
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

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
  tag?: string
): Promise<BlogListResponse> {
  const url = buildUrl(`${API_URL}/blogs`, { page, limit, tag });

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch published blogs');
  }

  return response.json();
}

/**
 * Get a single blog post by slug
 */
export async function getBlogBySlug(slug: string): Promise<{ post: BlogPost }> {
  const response = await fetch(`${API_URL}/blogs/slug/${slug}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 404) {
    throw new Error('Blog post not found');
  }

  if (!response.ok) {
    throw new Error('Failed to fetch blog post');
  }

  return response.json();
}

/**
 * Get all blogs for the current authenticated user (including drafts)
 */
export async function getUserBlogs(): Promise<{ posts: BlogPost[] }> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/blogs/user`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized. Please login to view your blogs.');
    }
    throw new Error('Failed to fetch user blogs');
  }

  return response.json();
}

/**
 * Create a new blog post
 */
export async function createBlog(blogData: BlogFormData): Promise<{ post: BlogPost }> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/blogs`, {
    method: 'POST',
    headers,
    body: JSON.stringify(blogData),
  });

  if (!response.ok) {
    if (response.status === 400) {
      const error = await response.json();
      throw new Error(error.message || 'Invalid blog data');
    }
    throw new Error('Failed to create blog post');
  }

  return response.json();
}

/**
 * Update an existing blog post
 */
export async function updateBlog(
  id: string, 
  blogData: Partial<BlogFormData>
): Promise<{ post: BlogPost }> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/blogs/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(blogData),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Blog post not found');
    }
    if (response.status === 400) {
      const error = await response.json();
      throw new Error(error.message || 'Invalid blog data');
    }
    throw new Error('Failed to update blog post');
  }

  return response.json();
}

/**
 * Delete a blog post
 */
export async function deleteBlog(id: string): Promise<{ message: string }> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/blogs/${id}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Blog post not found');
    }
    throw new Error('Failed to delete blog post');
  }

  return response.json();
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
  const { 'Content-Type': _, ...authHeaders } = headers;
  
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(`${API_URL}/blogs/upload-image`, {
    method: 'POST',
    headers: authHeaders,
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload image');
  }

  return response.json();
}
