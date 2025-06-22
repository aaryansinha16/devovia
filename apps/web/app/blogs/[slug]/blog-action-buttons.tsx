"use client";

import React, { useState, useEffect } from "react";
import { IconHeart, IconHeartFilled, IconShare } from "@tabler/icons-react";
import { Button } from "@repo/ui/components";
import { likeBlog, unlikeBlog, checkUserLike } from "../../../lib/services/public-blog-service";
import { useAuth } from "../../../lib/auth-context";
import { useToast } from "@repo/ui/hooks/use-toast";

interface BlogActionButtonsProps {
  postId: string;
  initialLikes: number;
}

export function BlogActionButtons({ postId, initialLikes }: BlogActionButtonsProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, openAuthModal } = useAuth();
  const { toast } = useToast();
  
  // Check if user has already liked the post when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      const checkLikeStatus = async () => {
        try {
          const { isLiked: userHasLiked, likeCount: currentLikeCount } = await checkUserLike(postId);
          setIsLiked(userHasLiked);
          setLikeCount(currentLikeCount);
        } catch (error) {
          console.error("Error checking like status:", error);
        }
      };
      
      checkLikeStatus();
    }
  }, [postId, isAuthenticated]);

  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    try {
      setIsLoading(true);
      
      if (isLiked) {
        const { likeCount: updatedCount } = await unlikeBlog(postId);
        setLikeCount(updatedCount);
        setIsLiked(false);
      } else {
        const { likeCount: updatedCount } = await likeBlog(postId);
        setLikeCount(updatedCount);
        setIsLiked(true);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        title: "Action failed",
        description: "Could not process your like. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    // Get the current URL
    const url = window.location.href;

    // Use the Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: url,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "Blog link copied to clipboard",
        });
      } catch (error) {
        console.error("Failed to copy:", error);
      }
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleLikeToggle}
        disabled={isLoading}
        className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
      >
        {isLiked ? (
          <IconHeartFilled className="h-5 w-5 text-red-500" />
        ) : (
          <IconHeart className="h-5 w-5" />
        )}
        <span>{likeCount}</span>
      </Button>

      <Button 
        variant="ghost" 
        size="sm"
        onClick={handleShare}
        className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
      >
        <IconShare className="h-5 w-5" />
        <span>Share</span>
      </Button>
    </div>
  );
}
