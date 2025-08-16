// Make this a client component to avoid the TypeScript error with params
"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getBlogBySlug } from '../../../lib/services/public-blog-service';
import { formatDate } from '../../../lib/utils/date-utils';
import { BlogComments } from './blog-comments';
import { BlogActionButtons } from './blog-action-buttons';
import { TracingBeam, TracingBeamDemo } from '@repo/ui/components';
import Footer from '../../../components/footer';
import Navbar from '../../../components/navbar';

// Since we're using a client component, we'll use a loading state
type BlogPost = Awaited<ReturnType<typeof getBlogBySlug>>;

// Loading component for Suspense
function BlogPostLoading() {
  return (
    <div className="container mx-auto px-4 py-10 flex justify-center items-center min-h-[60vh]">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Loading blog post...</h2>
      </div>
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
        console.log('Blog page: Post data received:', postData ? 'success' : 'null');

        if (!postData) {
          console.error('Blog page: Post data is null or undefined');
          notFound();
          return;
        }

        if (!postData.published) {
          console.log('Blog page: Post exists but is not published');
          notFound();
          return;
        }

        setPost(postData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load blog post'));
        console.error('Blog page: Error fetching post:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [slug]);

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Loading blog post...</h2>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-10 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Failed to load blog post</h2>
          <p className="mt-4">{error?.message || 'The requested blog post could not be found.'}</p>
          <Link href="/blogs" className="mt-6 inline-block text-blue-600 hover:underline">
            Back to all blogs
          </Link>
        </div>
      </div>
    );
  }

  // If we have a valid post, render it
  return (
    <div className="max-w-3xl mx-auto antialiased pt-4 relative pb-[100px]">
        {/* Post Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {post.title}
          </h1>

          <div className="flex items-center gap-3 mb-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center">
              {post.user.avatar ? (
                <div className="relative w-7 h-7 rounded-full overflow-hidden mr-2">
                  <Image
                    src={post.user.avatar}
                    alt={post.user.name || post.user.username}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-2">
                  <span className="text-xs text-blue-800 dark:text-blue-200 font-medium">
                    {(post.user.name || post.user.username || 'User').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span>{post.user.name || post.user.username}</span>
            </div>
            <span>•</span>
            <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
          </div>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="rounded-lg overflow-hidden mb-8">
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
            <div className="flex flex-wrap gap-2 mt-4 mb-6">
              {post.tags.map((tag, index) => (
                <Link
                  key={String(tag)}
                  href={`/blogs?tag=${tag}`}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </header>

        {/* Post Content */}
        <div
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Post Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center">
            <Link
              href="/blogs"
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
            >
              ← Back to all blogs
            </Link>

            <div>
              <BlogActionButtons postId={post.id} initialLikes={post._count?.likes || 0} />
            </div>
          </div>
        </footer>

        {/* Comments Section */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold mb-6">Comments</h3>
          <BlogComments postId={post.id} />
        </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function BlogPostPage() {
  return (
    <div className="relative w-full">
      <Navbar />
      <TracingBeam className="px-6">
        <Suspense fallback={<BlogPostLoading />}>
          <BlogPostContent />
        </Suspense>
      </TracingBeam>
      <Footer />
    </div>
    // <TracingBeamDemo />
  );
}
