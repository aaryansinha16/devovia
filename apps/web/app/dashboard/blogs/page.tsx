"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconLoader2,
  IconCalendar,
  IconExternalLink,
} from "@tabler/icons-react";
import {
  getUserBlogs,
  deleteBlog,
  BlogPost,
} from "../../../lib/services/blog-service";

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
        console.error("Failed to load blogs:", err);
        setError("Failed to load your blog posts. Please try again.");
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
        console.error("Failed to delete blog:", err);
        alert("Failed to delete the blog post. Please try again.");
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
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Blogs</h1>
          <p className="text-muted-foreground mt-1">
            Manage and create your blog content
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="py-2 px-3 border border-slate-600 rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="all">All Posts</option>
              <option value="published">Published</option>
              <option value="drafts">Drafts</option>
            </select>
          </div>

          <Link
            href="/dashboard/blogs/create"
            className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2"
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
        <div className="p-6 text-center text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
          <p className="text-foreground mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-primary hover:text-primary/80 underline"
          >
            Try Again
          </button>
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-slate-700">
          <h3 className="text-xl font-medium mb-2 text-foreground">
            No blog posts yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Start creating your first blog post now!
          </p>
          <Link
            href="/dashboard/blogs/create"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <IconPlus size={18} className="mr-2" />
            Create Blog
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredBlogs.map((blog) => (
            <div
              key={blog.id}
              className="bg-card border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {blog.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    {blog.excerpt}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <IconCalendar size={14} />
                      {new Date(blog.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <IconEye size={14} />
                      {blog._count?.likes || 0} likes
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        blog.published
                          ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                          : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20"
                      }`}
                    >
                      {blog.published ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Link
                    href={`/dashboard/blogs/edit/${blog.id}`}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
                    title="Edit"
                  >
                    <IconEdit size={16} />
                  </Link>
                  <Link
                    href={`/blogs/${blog.slug}`}
                    className="p-2 text-muted-foreground hover:text-green-600 dark:hover:text-green-400 hover:bg-accent rounded-lg transition-colors"
                    title="View"
                  >
                    <IconExternalLink size={16} />
                  </Link>
                  <button
                    onClick={() => handleDelete(blog.id)}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-accent rounded-lg transition-colors"
                    title="Delete"
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              </div>

              {blog.tags && blog.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag) => (
                    <span
                      key={String(tag)}
                      className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
