"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button, Textarea, GlowingEffect } from "@repo/ui/components";
import ClientPagination from "../../../components/client-pagination";
import { formatDate } from "../../../lib/utils/date-utils";
import { useAuth } from "../../../lib/auth-context";
import {
  getBlogComments,
  addBlogComment,
  deleteBlogComment,
  CommentResponse,
} from "../../../lib/services/public-blog-service";

// We can use the types from our service
type Comment = CommentResponse["comments"][0];

interface BlogCommentsProps {
  postId: string;
}

export function BlogComments({ postId }: BlogCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const { user, isAuthenticated, openAuthModal } = useAuth();

  // Fetch comments
  useEffect(() => {
    async function loadComments() {
      try {
        setIsLoading(true);
        const response = await getBlogComments(postId, currentPage, 10);
        setComments(response.comments);
        setTotalPages(response.totalPages);
        setTotalComments(response.total);
      } catch (error) {
        console.error("Failed to load comments:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadComments();
  }, [postId, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    if (!commentText.trim()) return;

    try {
      setIsSubmitting(true);
      const newComment = await addBlogComment(postId, commentText);

      // Reset the form and refresh comments list
      setCommentText("");
      setComments((prevComments) => [newComment, ...prevComments]);
      setTotalComments((prev) => prev + 1);
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteBlogComment(commentId);
      setComments((prevComments) =>
        prevComments.filter((comment) => comment.id !== commentId),
      );
      setTotalComments((prev) => prev - 1);
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  // Placeholder UI for loading state
  if (isLoading && comments.length === 0) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Comment form */}
      <div className="relative rounded-xl p-2 mb-8" style={{border:"2px solid rgb(40, 40, 45)"}}>
        <GlowingEffect
          spread={30}
          glow={true}
          disabled={false}
          proximity={150}
          inactiveZone={0.7}
        />
        <div className="relative bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg dark:shadow-gray-900/20">
        <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          {isAuthenticated ? "Leave a comment" : "Sign in to leave a comment"}
        </h4>
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <div className="relative">
            <Textarea
              placeholder={
                isAuthenticated 
                  ? "Share your thoughts on this blog post..." 
                  : "Please sign in to leave a comment"
              }
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={!isAuthenticated || isSubmitting}
              className="min-h-[120px] resize-none w-full rounded-lg border-0 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-blue-500 dark:text-gray-100 transition-all duration-200 shadow-inner p-4 text-base leading-relaxed"
              rows={5}
            />
            {commentText.length > 0 && (
              <div className="absolute bottom-3 right-3 text-xs text-gray-500 dark:text-gray-400">
                {commentText.length} characters
              </div>
            )}
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              {!isAuthenticated && (
                <button
                  type="button"
                  onClick={() => openAuthModal()}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Sign in to comment
                </button>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {commentText.trim() && (
                <button
                  type="button"
                  onClick={() => setCommentText("")}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Clear
                </button>
              )}
              <Button
                type="submit"
                disabled={!isAuthenticated || isSubmitting || !commentText.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Posting...</span>
                  </div>
                ) : (
                  "Post Comment"
                )}
              </Button>
            </div>
          </div>
        </form>
        </div>
      </div>

      {/* Comments list */}
      <div className="relative rounded-xl p-2" style={{border:"2px solid rgb(40, 40, 45)"}}>
        <GlowingEffect
          spread={30}
          glow={true}
          disabled={false}
          proximity={150}
          inactiveZone={0.7}
        />
        <div className="relative bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg dark:shadow-gray-900/20">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Comments
          </h4>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {totalComments} comment{totalComments !== 1 ? "s" : ""}
          </div>
        </div>

        {totalComments === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h5 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No comments yet
              </h5>
              <p className="text-gray-600 dark:text-gray-400">
                Be the first to share your thoughts on this blog post!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment, index) => (
              <div key={comment.id} className={`flex gap-4 ${index !== comments.length - 1 ? 'pb-6 border-b border-gray-100 dark:border-gray-800' : ''}`}>
                {/* User avatar */}
                {comment.user.avatar ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={comment.user.avatar}
                      alt={comment.user.name || comment.user.username}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                      {(comment.user.name || comment.user.username || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Comment content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {comment.user.name || comment.user.username}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>

                  <div className="text-gray-800 dark:text-gray-200">
                    {comment.content}
                  </div>

                  {/* Delete button for comment author */}
                  {user?.id === comment.user.id && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-xs text-red-600 dark:text-red-400 hover:underline mt-2"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 pt-6 bg-gray-50 dark:bg-gray-800/30 rounded-lg flex justify-center">
            <ClientPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
