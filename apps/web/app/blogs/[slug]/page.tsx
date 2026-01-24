// Make this a client component to avoid the TypeScript error with params
"use client";

import React, { useEffect, useState, Suspense } from "react";
import { notFound, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getBlogBySlug } from "../../../lib/services/public-blog-service";
import { formatDate } from "../../../lib/utils/date-utils";
import { BlogComments } from "./blog-comments";
import { BlogActionButtons } from "./blog-action-buttons";
import { Container, Heading, Text, GlassCard, BackgroundDecorative, Button } from "@repo/ui";
import { IconArrowLeft, IconClock, IconTag, IconMessage } from "@tabler/icons-react";
import Footer from "../../../components/footer";
import Navbar from "../../../components/navbar";

// Since we're using a client component, we'll use a loading state
type BlogPost = Awaited<ReturnType<typeof getBlogBySlug>>;

// Loading component for Suspense
function BlogPostLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 relative overflow-hidden">
      <BackgroundDecorative variant="subtle" />
      <Container className="relative z-10 py-20">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <Heading size="h2">Loading blog post...</Heading>
          </div>
        </div>
      </Container>
    </div>
  );
}

// Content component with useParams
function BlogPostContent() {
  const params = useParams();
  const slug = params?.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch post data on client side
  useEffect(() => {
    async function fetchPost() {
      try {
        if (!slug) {
          notFound();
          return;
        }

        console.log(`Blog page: Fetching blog with slug '${slug}'`);
        const postData = await getBlogBySlug(slug);
        console.log(
          "Blog page: Post data received:",
          postData ? "success" : "null",
        );

        if (!postData) {
          console.error("Blog page: Post data is null or undefined");
          notFound();
          return;
        }

        if (!postData.published) {
          console.log("Blog page: Post exists but is not published");
          notFound();
          return;
        }

        setPost(postData);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to load blog post"),
        );
        console.error("Blog page: Error fetching post:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [slug]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 relative overflow-hidden">
        <BackgroundDecorative variant="subtle" />
        <Container className="relative z-10 py-20">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <Heading size="h2">Loading blog post...</Heading>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Error state
  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 relative overflow-hidden">
        <BackgroundDecorative variant="subtle" />
        <Container className="relative z-10 py-20">
          <div className="flex justify-center items-center min-h-[60vh]">
            <GlassCard className="text-center max-w-md">
              <div className="text-6xl mb-4">📄</div>
              <Heading size="h2" className="mb-4">Blog post not found</Heading>
              <Text className="mb-6">
                {error?.message || "The requested blog post could not be found."}
              </Text>
              <Button
                href="/blogs"
                variant="gradient"
                leftIcon={<IconArrowLeft className="w-4 h-4" />}
              >
                Back to all blogs
              </Button>
            </GlassCard>
          </div>
        </Container>
      </div>
    );
  }

  // If we have a valid post, render it
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 relative overflow-hidden">
      <BackgroundDecorative variant="subtle" />
      <Container className="relative z-10 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <div className="mb-8">
            <Button
              href="/blogs"
              variant="ghost"
              leftIcon={<IconArrowLeft className="w-4 h-4" />}
            >
              Back to all blogs
            </Button>
          </div>

          <GlassCard className="mb-8">
            {/* Post Header */}
            <header className="mb-8">
              <Heading size="h1" className="mb-6">
                {post.title}
              </Heading>

              <div className="flex items-center gap-3 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  {post.user.avatar ? (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-sky-500/20">
                      <Image
                        src={post.user.avatar}
                        alt={post.user.name || post.user.username}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center ring-2 ring-sky-500/20">
                      <span className="text-sm text-white font-bold">
                        {(post.user.name || post.user.username || "User")
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <Text size="sm" className="font-semibold">{post.user.name || post.user.username}</Text>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <IconClock className="w-3.5 h-3.5" />
                      <time dateTime={post.createdAt} className="text-xs">{formatDate(post.createdAt)}</time>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cover Image */}
              {post.coverImage && (
                <div className="rounded-xl overflow-hidden mb-8 -mx-6 md:-mx-8">
                  <div className="relative aspect-video w-full">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 50vw"
                      priority
                      quality={90}
                    />
                  </div>
                </div>
              )}

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {post.tags.map((tag, index) => (
                    <Link
                      key={String(tag)}
                      href={`/blogs?tag=${tag}`}
                      className="px-3 py-1.5 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 text-sky-700 dark:text-sky-300 rounded-lg text-sm font-medium hover:from-sky-500/20 hover:to-indigo-500/20 transition-all flex items-center gap-1.5"
                    >
                      <IconTag className="w-3.5 h-3.5" />
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
            </header>

            {/* Post Content */}
            <article
              className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-a:text-sky-600 dark:prose-a:text-sky-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-code:text-sky-600 dark:prose-code:text-sky-400 prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-900 dark:prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-700 prose-img:rounded-xl prose-img:shadow-lg"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </GlassCard>

          {/* Post Footer */}
          <GlassCard className="mb-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <BlogActionButtons
                  postId={post.id}
                  initialLikes={post._count?.likes || 0}
                />
              </div>
            </div>
          </GlassCard>

          {/* Comments Section */}
          <GlassCard>
            <Heading size="h3" className="mb-6 flex items-center gap-2">
              <IconMessage className="w-6 h-6 text-sky-500" />
              Comments
            </Heading>
            <BlogComments postId={post.id} />
          </GlassCard>
        </div>
      </Container>
    </div>
  );
}

// Main component with Suspense boundary
export default function BlogPostPage() {
  return (
    <div className="relative w-full">
      <Navbar />
      <div className="pt-20 md:pt-24">
        <Suspense fallback={<BlogPostLoading />}>
          <BlogPostContent />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
