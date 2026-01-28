"use client";

import React, { useState, useEffect } from "react";
import { IconHeart, IconHeartFilled, IconShare } from "@tabler/icons-react";
import { Button } from "@repo/ui";
import { cn } from "@repo/ui/lib/utils";
import { HeartBlastAnimation, HeartParticles, FloatingHearts } from "../../../components/heart-blast-animation";
import {
  likeBlog,
  unlikeBlog,
  checkUserLike,
} from "../../../lib/services/public-blog-service";
import { useAuth } from "../../../lib/auth-context";
import { useToast } from "@repo/ui/hooks/use-toast";
import { useBlogLike } from "../../../lib/hooks/useBlog";

interface BlogActionButtonsProps {
  postId: string;
  initialLikes: number;
}

export function BlogActionButtons({
  postId,
  initialLikes,
}: BlogActionButtonsProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showBlast, setShowBlast] = useState(false);
  const { isAuthenticated, openAuthModal } = useAuth();
  const { toast } = useToast();

  const { isLiked, likeCount, loading, like, unlike } = useBlogLike(postId, isAuthenticated);

  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    setIsAnimating(true);
    
    try {
      if (isLiked) {
        await unlike();
      } else {
        await like();
        setShowBlast(true);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        title: "Action failed",
        description: "Could not process your like. Please try again.",
        type: "error",
      });
    }

    setTimeout(() => {
      setIsAnimating(false);
      setShowBlast(false);
    }, 1000);
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
    <div className="flex items-center gap-3">
      <div className="relative">
        <Button
          variant="secondary"
          size="md"
          onClick={handleLikeToggle}
          disabled={loading}
          leftIcon={
            <span className={cn(
              "inline-block transition-transform duration-300",
              isAnimating && isLiked && "animate-heart-pop",
              isAnimating && !isLiked && "animate-[heartBeat_0.6s_ease-in-out]"
            )}>
              {isLiked ? (
                <IconHeartFilled className="h-5 w-5 text-red-500" />
              ) : (
                <IconHeart className="h-5 w-5" />
              )}
            </span>
          }
          className={cn(
            "transition-all duration-300 relative z-10",
            isLiked && "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
          )}
        >
          {likeCount}
        </Button>
        
        <HeartBlastAnimation isPlaying={showBlast} />
        <HeartParticles isPlaying={showBlast} />
        <FloatingHearts isPlaying={showBlast} />
      </div>

      <Button
        variant="secondary"
        size="md"
        onClick={handleShare}
        leftIcon={<IconShare className="h-5 w-5" />}
      >
        Share
      </Button>
    </div>
  );
}
