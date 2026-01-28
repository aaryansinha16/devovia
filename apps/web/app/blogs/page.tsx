"use client";

import React, { useState, useEffect, Suspense, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getAllPublishedBlogs } from "../../lib/services/public-blog-service";
import { Button, Container, Heading, Text, GlassCard, BackgroundDecorative } from "@repo/ui";
import ServerPagination from "../../components/server-pagination";
import { formatDate } from "../../lib/utils/date-utils";
import Footer from "../../components/footer";
import Navbar from "../../components/navbar";
import { IconSearch, IconTag, IconClock, IconMessage, IconArrowRight, IconX, IconTrendingUp, IconSparkles } from "@tabler/icons-react";
import Loader from '../../components/ui/loader';
import { useDebouncedValue } from "../../lib/hooks/useDebounce";
import { usePublishedBlogs } from "../../lib/hooks/useBlog";

type BlogsData = Awaited<ReturnType<typeof getAllPublishedBlogs>>;

// Create a loading component for Suspense
function BlogsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 relative overflow-hidden">
      <BackgroundDecorative variant="subtle" />
      <Container className="relative z-10 py-12">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <Heading size="h2">Loading blogs...</Heading>
          </div>
        </div>
      </Container>
    </div>
  );
}

// Separate the blogs content into its own component that uses useSearchParams
function BlogsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateQueryParam = useCallback(
    (key: string, value?: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }

      params.set("page", "1"); // reset pagination on new search

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const pageParam = searchParams.get("page") || "1";
  const tagParam = searchParams.get("tag") || undefined;

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const limit = 10;

  const debouncedSearch = useDebouncedValue(searchQuery, 500);
  const page = useMemo(() => parseInt(pageParam) || 1, [pageParam]);

  useEffect(() => {
    if (debouncedSearch !== undefined) {
      updateQueryParam("search", debouncedSearch || undefined);
    }
  }, [debouncedSearch, updateQueryParam]);

  const { 
    data: posts,
    pagination,
    loading,
    error,
    refetch
  } = usePublishedBlogs(page || 1, 12, tagParam, debouncedSearch);

  // Loading state
  // if (loading) {
  //   return <Loader />;
  // }

  // Error state
  if (error || !posts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 relative overflow-hidden">
        <BackgroundDecorative variant="subtle" />
        <Container className="relative z-10 py-20">
          <div className="flex justify-center items-center min-h-[60vh]">
            <GlassCard className="text-center max-w-md">
              <div className="text-6xl mb-4">⚠️</div>
              <Heading size="h2" className="mb-4">Failed to load blogs</Heading>
              <Text className="mb-6">
                {error?.message || "Could not retrieve blog posts."}
              </Text>
              <Button
                variant="gradient"
                onClick={() => window.location.reload()}
              >
                Try again
              </Button>
            </GlassCard>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 relative overflow-hidden">
      <BackgroundDecorative variant="subtle" />
      <Container className="relative z-10 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 rounded-full mb-6">
              <IconSparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <Text size="sm" className="font-medium text-sky-700 dark:text-sky-300">
                Latest Articles & Insights
              </Text>
            </div>
            <Heading size="h1" className="mb-4 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              Discover Our Blog
            </Heading>
            <Text size="lg" variant="muted" className="max-w-2xl mx-auto">
              Explore in-depth articles, tutorials, and insights on development, automation, and technology
            </Text>
          </div>

          {/* Stats and Filter Bar */}
          <div className="mb-12">
            <GlassCard className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <IconTrendingUp className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  <div>
                    <Text size="sm" variant="muted">Total Posts</Text>
                    <Text className="font-bold text-lg">{pagination.total || 0}</Text>
                  </div>
                </div>
                {tagParam && (
                  <div className="flex items-center gap-2">
                    <IconTag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-700 dark:text-sky-300 rounded-lg text-sm font-medium flex items-center gap-2">
                        #{tagParam}
                        <Link href="/blogs">
                          <IconX className="w-4 h-4 hover:text-red-500 cursor-pointer transition-colors" />
                        </Link>
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Blog list */}
          <div className="grid gap-6">
            {
              loading ? <Loader /> : 
              posts.length === 0 ? (
              <GlassCard className="text-center py-20">
                <div className="text-6xl mb-4">📝</div>
                <Heading size="h3" className="mb-2">No posts found</Heading>
                <Text variant="muted" className="mb-6">
                  {tagParam
                    ? `No posts found with tag "${tagParam}"`
                    : "No published posts yet."}
                </Text>
                <Button href="/blogs" variant="gradient">
                  View all posts
                </Button>
              </GlassCard>
            ) : (
              <>
                {/* Featured post (first post) */}
                {pagination.page === 1 && posts.length > 0 && posts[0] && (
                  <GlassCard className="group hover:shadow-2xl transition-all duration-300 mb-12">
                    <div className="grid md:grid-cols-1 gap-6">
                      {posts[0]?.coverImage && (
                        <div className="relative h-64 md:h-full rounded-xl overflow-hidden">
                          <Image
                            src={posts[0].coverImage}
                            alt={posts[0].title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-4 left-4">
                            <span className="px-3 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                              <IconSparkles className="w-3 h-3" />
                              Featured
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col justify-between">
                        <div>
                          <Heading size="h2" className="mb-4 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                            <Link href={`/blogs/${posts[0].slug}`}>
                              {posts[0].title}
                            </Link>
                          </Heading>
                          <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              {posts[0].user.avatar ? (
                                <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-sky-500/20">
                                  <Image
                                    src={posts[0].user.avatar}
                                    alt={posts[0].user.name || posts[0].user.username}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center ring-2 ring-sky-500/20">
                                  <span className="text-xs text-white font-bold">
                                    {(posts[0].user.name || posts[0].user.username || "U").charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <Text size="sm" className="font-medium">{posts[0].user.name || posts[0].user.username}</Text>
                            </div>
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                              <IconClock className="w-4 h-4" />
                              <Text size="sm">{formatDate(posts[0].createdAt)}</Text>
                            </div>
                          </div>
                          <Text className="mb-4 line-clamp-3">{posts[0].excerpt}</Text>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-2">
                            {posts[0].tags.slice(0, 3).map((tag) => (
                              <Link
                                key={String(tag)}
                                href={`/blogs?tag=${encodeURIComponent(String(tag))}`}
                                className="px-2 py-1 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 text-sky-700 dark:text-sky-300 rounded text-xs font-medium hover:from-sky-500/20 hover:to-indigo-500/20 transition-all"
                              >
                                #{String(tag)}
                              </Link>
                            ))}
                          </div>
                          <Button
                            href={`/blogs/${posts[0].slug}`}
                            variant="gradient"
                            size="sm"
                            rightIcon={<IconArrowRight className="w-4 h-4" />}
                          >
                            Read More
                          </Button>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                )}

                {/* Regular posts grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {posts.slice(pagination.page === 1 ? 1 : 0).map((post) => (
                    <GlassCard key={post.id} className="group hover:shadow-2xl transition-all duration-300">
                      {post.coverImage && (
                        <Link href={`/blogs/${post.slug}`} className="block mb-4 rounded-xl overflow-hidden -m-6 mb-6">
                          <div className="relative aspect-video w-full">
                            <Image
                              src={post.coverImage}
                              alt={post.title}
                              fill
                              className="object-cover transition-transform group-hover:scale-105 duration-500"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              quality={85}
                            />
                          </div>
                        </Link>
                      )}
                      
                      <Link href={`/blogs/${post.slug}`}>
                        <Heading size="h3" className="mb-3 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          {post.title}
                        </Heading>
                      </Link>

                  <div className="flex items-center gap-3 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      {post.user.avatar ? (
                        <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-sky-500/20">
                          <Image
                            src={post.user.avatar}
                            alt={post.user.name || post.user.username}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center ring-2 ring-sky-500/20">
                          <span className="text-xs text-white font-bold">
                            {(post.user.name || post.user.username || "User")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                      <Text size="sm" className="font-medium">{post.user.name || post.user.username}</Text>
                    </div>
                    <span className="text-slate-400">•</span>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <IconClock className="w-4 h-4" />
                      <time dateTime={post.createdAt}>
                        {formatDate(post.createdAt)}
                      </time>
                    </div>
                    {post._count && (
                      <>
                        <span className="text-slate-400">•</span>
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <IconMessage className="w-4 h-4" />
                          <span>
                            {post._count.comments}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {post.excerpt && (
                    <Text className="mb-4 line-clamp-3">
                      {post.excerpt}
                    </Text>
                  )}

                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {post.tags.map((tag, index) => (
                        <Link
                          key={String(tag)}
                          href={`/blogs?tag=${encodeURIComponent(String(tag))}`}
                          className="px-3 py-1.5 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 text-sky-700 dark:text-sky-300 rounded-lg text-sm font-medium hover:from-sky-500/20 hover:to-indigo-500/20 transition-all"
                        >
                          #{String(tag)}
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      href={`/blogs/${post.slug}`}
                      variant="link"
                      className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 p-0 group/btn"
                      rightIcon={<IconArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />}
                    >
                      Read more
                    </Button>
                  </div>
                </GlassCard>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          {posts.length > 0 && pagination.total > limit && (
            <div className="mt-12 flex justify-center">
              <GlassCard padding="sm">
                <ServerPagination
                  currentPage={pagination.page}
                  totalPages={Math.ceil(pagination.totalPages) || 1}
                  basePath="/blogs"
                  queryParams={{ tag: tagParam }}
                />
              </GlassCard>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}

// Main page component that wraps the content with Suspense
export default function BlogsPage() {
  return (
    <div className="relative w-full">
      <Navbar />
      <div className="pt-20 md:pt-24">
        <Suspense fallback={<BlogsLoading />}>
          <BlogsContent />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
