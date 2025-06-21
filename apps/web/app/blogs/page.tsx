import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { getAllPublishedBlogs } from '../../lib/services/public-blog-service';
import { Button } from '@repo/ui/components';
import ServerPagination from '../../components/server-pagination';
import { formatDate } from '../../lib/utils/date-utils';

export const metadata: Metadata = {
  title: 'Developer Blogs | Devovia',
  description: 'Latest blogs, tutorials, and insights for developers',
};

interface BlogsPageProps {
  searchParams: { page?: string; tag?: string };
}

export default async function BlogsPage({
  searchParams,
}: BlogsPageProps) {
  // Fix: Must await searchParams properties in Next.js App Router
  const pageParam = await Promise.resolve(searchParams.page || '1');
  const page = parseInt(pageParam);
  const limit = 10;
  const tag = await Promise.resolve(searchParams.tag);
  
  try {
    const blogsData = await getAllPublishedBlogs(page, limit, tag);
    const { posts, total, hasMore } = blogsData;

    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-2">Developer Blogs</h1>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-12">
            Latest tutorials, insights, and developer stories
          </p>
          
          {/* Tag filter if tag is applied */}
          {tag && (
            <div className="mb-8 flex items-center justify-center">
              <div className="bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-full flex items-center">
                <span className="mr-2">Filtered by:</span>
                <span className="bg-blue-100 dark:bg-blue-800 px-3 py-1 rounded-full text-blue-800 dark:text-blue-200 font-medium text-sm flex items-center">
                  {tag}
                  <Link href="/blogs" className="ml-2 hover:text-blue-600">
                    <span className="sr-only">Remove filter</span>
                    ×
                  </Link>
                </span>
              </div>
            </div>
          )}

          {/* Blog list */}
          <div className="grid gap-8 md:gap-10">
            {posts.length === 0 ? (
              <div className="text-center py-20">
                <h3 className="text-xl font-medium mb-2">No posts found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {tag ? `No posts found with tag "${tag}"` : 'No published posts yet.'}
                </p>
                <Link href="/blogs">
                  <Button>View all posts</Button>
                </Link>
              </div>
            ) : (
              posts.map((post) => (
                <article key={post.id} className="border-b border-gray-200 dark:border-gray-800 pb-8 last:border-b-0">
                  <Link href={`/blogs/${post.slug}`}>
                    <div className="group">
                      {post.coverImage && (
                        <div className="mb-6 rounded-lg overflow-hidden">
                          <div className="relative aspect-video w-full">
                            <Image
                              src={post.coverImage}
                              alt={post.title}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 60vw"
                              quality={85}
                            />
                          </div>
                        </div>
                      )}
                      <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {post.title}
                      </h2>
                    </div>
                  </Link>
                  
                  <div className="flex items-center gap-3 mb-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      {post.user.avatar ? (
                        <div className="relative w-6 h-6 rounded-full overflow-hidden mr-2">
                          <Image 
                            src={post.user.avatar}
                            alt={post.user.name || post.user.username}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-2">
                          <span className="text-xs text-blue-800 dark:text-blue-200 font-medium">
                            {(post.user.name || post.user.username || 'User').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span>{post.user.name || post.user.username}</span>
                    </div>
                    <span>•</span>
                    <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
                    {post._count && (
                      <>
                        <span>•</span>
                        <span>{post._count.comments} comment{post._count.comments !== 1 ? 's' : ''}</span>
                      </>
                    )}
                  </div>
                  
                  {post.excerpt && (
                    <p className="text-gray-700 dark:text-gray-300 mb-4">{post.excerpt}</p>
                  )}
                  
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {post.tags.map((tag, index) => (
                        <Link 
                          key={typeof tag === 'string' ? tag : tag.id || `tag-${index}`} 
                          href={`/blogs?tag=${encodeURIComponent(typeof tag === 'string' ? tag : tag.name)}`}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          {typeof tag === 'string' ? tag : tag.name}
                        </Link>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <Link href={`/blogs/${post.slug}`}>
                      <Button variant="ghost" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-0">
                        Read more →
                      </Button>
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
          
          {/* Pagination */}
          {posts.length > 0 && (
            <div className="mt-12 flex justify-center">
              <ServerPagination
                currentPage={page}
                totalPages={Math.ceil(total / limit)}
                basePath="/blogs"
                queryParams={{ tag: tag || undefined }}
              />
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Failed to load blogs:', error);
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Error Loading Blogs</h1>
        <p className="mb-8">Sorry, we encountered an error while loading the blog posts.</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }
}
