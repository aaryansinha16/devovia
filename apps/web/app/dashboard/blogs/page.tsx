"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";
import { IconPlus, IconEdit, IconTrash, IconEye, IconLoader2 } from "@tabler/icons-react";
import { getUserBlogs, deleteBlog, BlogPost } from "../../../lib/services/blog-service";

export default function BlogsDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all"); // all, published, drafts

  // Load user blogs on component mount
  useEffect(() => {
    async function loadUserBlogs() {
      try {
        setLoading(true);
        setError(null);
        const data = await getUserBlogs();
        setBlogs(data.posts);
      } catch (err) {
        console.error('Failed to load blogs:', err);
        setError('Failed to load your blog posts. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    loadUserBlogs();
  }, []);

  const filteredBlogs = blogs.filter((blog) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "published") return blog.published;
    if (filterStatus === "drafts") return !blog.published;
    return true;
  });

  // Delete blog handler
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this blog post?")) {
      try {
        await deleteBlog(id);
        setBlogs((prev) => prev.filter((blog) => blog.id !== id));
      } catch (err) {
        console.error('Failed to delete blog:', err);
        alert('Failed to delete the blog post. Please try again.');
      }
    }
  };

  // Format date to readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Your Blogs</h1>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="py-2 px-3 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="all">All Posts</option>
              <option value="published">Published</option>
              <option value="drafts">Drafts</option>
            </select>
          </div>

          <Link 
            href="/dashboard/blogs/create" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2"
          >
            <IconPlus size={18} />
            <span>Create Blog</span>
          </Link>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <IconLoader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="p-4 text-center text-destructive bg-destructive/10 rounded-md">
          {error}
          <button 
            onClick={() => window.location.reload()} 
            className="block mx-auto mt-2 text-sm underline"
          >
            Try Again
          </button>
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-12 bg-accent/20 rounded-md">
          <h3 className="text-xl font-medium mb-2">No blog posts yet</h3>
          <p className="text-muted-foreground mb-4">Start creating your first blog post now!</p>
          <Link 
            href="/dashboard/blogs/create" 
            className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <IconPlus size={18} className="mr-2" />
            Create Blog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBlogs.map((blog) => (
            <div 
              key={blog.id} 
              className="bg-card border border-border rounded-lg overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-all duration-200"
            >
              {blog.coverImage && (
                <div className="w-full md:w-48 h-48 md:h-auto relative">
                  <img 
                    src={blog.coverImage} 
                    alt={blog.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-semibold">{blog.title}</h2>
                    {!blog.published && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500 rounded-full text-xs font-medium">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {blog.excerpt || "No excerpt available"}
                  </p>
                  <div className="text-sm text-muted-foreground">
                    Last updated {formatDate(blog.updatedAt)}
                  </div>
                </div>
                <div className="flex items-center mt-4 gap-2">
                  <Link 
                    href={`/dashboard/blogs/edit/${blog.id}`}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 border border-border bg-background hover:bg-accent text-foreground h-9 px-3"
                  >
                    <IconEdit size={16} className="mr-1" /> Edit
                  </Link>
                  {blog.published && (
                    <Link 
                      href={`/blogs/${blog.slug}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 border border-border bg-background hover:bg-accent text-foreground h-9 px-3"
                    >
                      <IconEye size={16} className="mr-1" /> View
                    </Link>
                  )}
                  <button 
                    onClick={() => handleDelete(blog.id)}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 border border-destructive bg-background hover:bg-destructive/10 text-destructive h-9 px-3 ml-auto"
                  >
                    <IconTrash size={16} className="mr-1" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
