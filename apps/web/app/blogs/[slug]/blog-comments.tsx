"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button, Textarea } from "@repo/ui/components";
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
      <form onSubmit={handleSubmitComment} className="mb-8">
        <Textarea
          placeholder={
            isAuthenticated ? "Add a comment..." : "Sign in to comment"
          }
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          disabled={!isAuthenticated || isSubmitting}
          className="mb-3 h-24"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!isAuthenticated || isSubmitting || !commentText.trim()}
            className="flex items-center gap-2"
          >
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </form>

      {/* Comments list */}
      {totalComments === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <p className="text-gray-600 dark:text-gray-400">
            No comments yet. Be the first to comment!
          </p>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {totalComments} comment{totalComments !== 1 ? "s" : ""}
          </div>

          <div className="space-y-8">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-4">
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <ClientPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
