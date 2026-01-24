"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button, Textarea, Heading, Text } from "@repo/ui";
import { IconSend, IconTrash } from "@tabler/icons-react";
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
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Comment form */}
      <div className="mb-8">
        <Heading size="h4" className="mb-4">
          {isAuthenticated ? "Leave a comment" : "Sign in to leave a comment"}
        </Heading>
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <Textarea
            placeholder={
              isAuthenticated 
                ? "Share your thoughts on this blog post..." 
                : "Please sign in to leave a comment"
            }
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={!isAuthenticated || isSubmitting}
            className="min-h-[120px] resize-none"
            rows={5}
          />
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {!isAuthenticated && (
                <Button
                  type="button"
                  onClick={() => openAuthModal()}
                  variant="link"
                  size="sm"
                >
                  Sign in to comment
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {commentText.trim() && (
                <Button
                  type="button"
                  onClick={() => setCommentText("")}
                  variant="ghost"
                  size="sm"
                >
                  Clear
                </Button>
              )}
              <Button
                type="submit"
                disabled={!isAuthenticated || isSubmitting || !commentText.trim()}
                variant="gradient"
                size="md"
                rightIcon={!isSubmitting ? <IconSend className="w-4 h-4" /> : undefined}
              >
                {isSubmitting ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Comments list */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
        <div className="flex items-center justify-between mb-6">
          <Heading size="h4">All Comments</Heading>
          <Text size="sm" variant="muted">
            {totalComments} comment{totalComments !== 1 ? "s" : ""}
          </Text>
        </div>

        {totalComments === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <div className="text-6xl mb-4">💬</div>
            <Heading size="h4" className="mb-2">
              No comments yet
            </Heading>
            <Text variant="muted">
              Be the first to share your thoughts on this blog post!
            </Text>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment, index) => (
              <div key={comment.id} className={`flex gap-4 ${index !== comments.length - 1 ? 'pb-6 border-b border-slate-200 dark:border-slate-700' : ''}`}>
                {/* User avatar */}
                {comment.user.avatar ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-sky-500/20">
                    <Image
                      src={comment.user.avatar}
                      alt={comment.user.name || comment.user.username}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center flex-shrink-0 ring-2 ring-sky-500/20">
                    <span className="text-sm text-white font-bold">
                      {(comment.user.name || comment.user.username || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Comment content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Text size="sm" className="font-semibold">
                      {comment.user.name || comment.user.username}
                    </Text>
                    <Text size="sm" variant="muted">
                      {formatDate(comment.createdAt)}
                    </Text>
                  </div>

                  <Text className="mb-2">
                    {comment.content}
                  </Text>

                  {/* Delete button for comment author */}
                  {user?.id === comment.user.id && (
                    <Button
                      onClick={() => handleDeleteComment(comment.id)}
                      variant="ghost"
                      size="sm"
                      leftIcon={<IconTrash className="w-3.5 h-3.5" />}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 -ml-2"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-center">
            <ClientPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
