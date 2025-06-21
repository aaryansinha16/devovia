import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getBlogBySlug } from '../../../lib/services/public-blog-service';
import { formatDate } from '../../../lib/utils/date-utils';
import { BlogComments } from './blog-comments';
import { BlogActionButtons } from './blog-action-buttons';

// Generate metadata for the blog post
export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string }
}): Promise<Metadata> {
  try {
    // Properly await the slug parameter before using it
    const slug = await Promise.resolve(params.slug);
    const post = await getBlogBySlug(slug);
    
    return {
      title: `${post.title} | Devovia Blog`,
      description: post.excerpt || `Read ${post.title} on Devovia`,
      openGraph: post.coverImage ? {
        images: [{ url: post.coverImage }],
      } : undefined,
    };
  } catch (error) {
    return {
      title: 'Blog Post | Devovia',
      description: 'Developer blogs, tutorials, and insights',
    };
  }
}

export default async function BlogPostPage({ 
  params 
}: { 
  params: { slug: string }
}) {
  try {
    // Properly await the slug parameter before using it
    const slug = await Promise.resolve(params.slug);
    console.log(`Blog page: Fetching blog with slug '${slug}'`);
    
    // Fetch the post data
    const post = await getBlogBySlug(slug);
    console.log('Blog page: Post data received:', post ? 'success' : 'null');
    
    if (!post) {
      console.error('Blog page: Post data is null or undefined');
      notFound();
    }
    
    if (!post.published) {
      console.log('Blog page: Post exists but is not published');
      notFound();
    }

    // If we get here, we have a valid published post
    return (
      <article className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
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
                {post.tags.map(tag => (
                  <Link 
                    key={tag.id} 
                    href={`/blogs?tag=${encodeURIComponent(tag.name)}`}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    {tag.name}
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
      </article>
    );
  } catch (error) {
    console.error(`Failed to load blog post with slug: ${params.slug}`, error);
    notFound();
  }
}
