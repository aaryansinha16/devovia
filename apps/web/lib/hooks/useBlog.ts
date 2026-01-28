/**
 * Blog-specific hooks that wrap the generic API hooks
 * with blog service functions for convenience
 */

import { useApiData, usePaginatedData, useApiMutation } from './useApiData';
import {
  getAllPublishedBlogs,
  getBlogBySlug,
  likeBlog,
  unlikeBlog,
  getBlogComments,
  addBlogComment,
  deleteBlogComment,
  type BlogPost,
  type Comment,
  checkUserLike,
} from '../services/public-blog-service';
import {
  getUserBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  type BlogFormData,
} from '../services/blog-service';
import { useCallback } from 'react';

/**
 * Hook for fetching paginated published blogs
 */
export function usePublishedBlogs(
  page: number = 1,
  limit: number = 12,
  tag?: string,
  search?: string
) {
  const fetcher = useCallback(
    () => getAllPublishedBlogs(page, limit, tag, search),
    [page, limit, tag, search]
  );

  return usePaginatedData<BlogPost>(fetcher, page, limit);
}

/**
 * Hook for fetching a single blog by slug
 */
export function useBlogBySlug(slug: string) {
  return useApiData<BlogPost>(
    () => getBlogBySlug(slug),
    [slug]
  );
}

/**
 * Hook for fetching user's blogs (authenticated)
 */
export function useUserBlogs() {
  return useApiData(
    () => getUserBlogs(),
    []
  );
}

/**
 * Combined hook for blog like status and actions with optimistic updates
 */
export function useBlogLike(postId: string, isAuthenticated: boolean) {
  const { 
    data: likeData, 
    loading: statusLoading, 
    error,
    refetch 
  } = useApiData<{ isLiked: boolean; likeCount: number }>(
    () => checkUserLike(postId, isAuthenticated),
    [postId, isAuthenticated]
  );

  const { mutate: likeAction, loading: liking } = useApiMutation<{ likeCount: number }, void>(
    () => likeBlog(postId)
  );
  
  const { mutate: unlikeAction, loading: unliking } = useApiMutation<{ likeCount: number }, void>(
    () => unlikeBlog(postId)
  );

  const like = useCallback(async () => {
    const result = await likeAction();
    await refetch(); // Refetch to sync UI with server
    return result;
  }, [likeAction, refetch]);

  const unlike = useCallback(async () => {
    const result = await unlikeAction();
    await refetch(); // Refetch to sync UI with server
    return result;
  }, [unlikeAction, refetch]);

  return {
    isLiked: likeData?.isLiked ?? false,
    likeCount: likeData?.likeCount ?? 0,
    loading: statusLoading || liking || unliking,
    error,
    like,
    unlike,
  };
}

/**
 * Hook for creating a blog
 */
export function useCreateBlog() {
  return useApiMutation(createBlog);
}

/**
 * Hook for updating a blog
 */
export function useUpdateBlog(id: string) {
  return useApiMutation(
    (data: BlogFormData) => updateBlog(id, data)
  );
}

/**
 * Hook for deleting a blog
 */
export function useDeleteBlog(id: string) {
  return useApiMutation<void, void>(
    () => deleteBlog(id)
  );
}

/**
 * Hook for fetching blog comments
 */
export function useBlogComments(postId: string, page: number = 1, limit: number = 10) {
  const fetcher = useCallback(
    () => getBlogComments(postId, page, limit),
    [postId, page, limit]
  );

  return usePaginatedData<Comment>(fetcher, page, limit);
}

/**
 * Hook for adding a comment
 */
export function useAddComment(postId: string) {
  return useApiMutation<Comment, string>(
    (content) => addBlogComment(postId, content)
  );
}

/**
 * Hook for deleting a comment
 */
export function useDeleteComment(commentId: string) {
  return useApiMutation<void, void>(
    () => deleteBlogComment(commentId)
  );
}
