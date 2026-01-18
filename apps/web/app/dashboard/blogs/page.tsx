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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-sky-500/20 dark:bg-sky-400/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/20 dark:bg-purple-400/20 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-sky-400/10 to-indigo-400/10 dark:from-sky-500/10 dark:to-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-800 to-sky-600 dark:from-slate-100 dark:to-sky-400 bg-clip-text text-transparent">Your Blogs</h1>
            <p className="text-slate-600 dark:text-slate-300 mt-3 text-base sm:text-lg">
              Manage and create your blog content
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="py-3 px-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-lg transition-all"
            >
              <option value="all">All Posts</option>
              <option value="published">Published</option>
              <option value="drafts">Drafts</option>
            </select>

            <Link
              href="/dashboard/blogs/create"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 px-6 py-3 rounded-xl font-medium transition-all duration-200 text-white shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40 hover:scale-105"
            >
              <IconPlus size={18} />
              <span>Create Blog</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <IconLoader2 className="w-8 h-8 animate-spin text-sky-500" />
          </div>
        ) : error ? (
          <div className="p-6 text-center bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-500">
            <p className="text-red-600 dark:text-red-400 mb-3">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 underline font-medium"
            >
              Try Again
            </button>
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-16 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-700">
            <div className="text-7xl mb-6">📝</div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">
              No blog posts yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg">
              Start creating your first blog post now!
            </p>
            <Link
              href="/dashboard/blogs/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-sky-500/30"
            >
              <IconPlus size={18} />
              Create Blog
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredBlogs.map((blog) => (
              <div
                key={blog.id}
                className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {blog.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                      {blog.excerpt}
                    </p>

                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400">
                        <IconCalendar size={14} />
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400">
                        <IconEye size={14} />
                        {blog._count?.likes || 0} likes
                      </span>
                      <span
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                          blog.published
                            ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                            : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
                        }`}
                      >
                        {blog.published ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      href={`/dashboard/blogs/edit/${blog.id}`}
                      className="p-2.5 text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-xl transition-all"
                      title="Edit"
                    >
                      <IconEdit size={18} />
                    </Link>
                    <Link
                      href={`/blogs/${blog.slug}`}
                      className="p-2.5 text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all"
                      title="View"
                    >
                      <IconExternalLink size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(blog.id)}
                      className="p-2.5 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                      title="Delete"
                    >
                      <IconTrash size={18} />
                    </button>
                  </div>
                </div>

                {blog.tags && blog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {blog.tags.map((tag) => (
                      <span
                        key={String(tag)}
                        className="px-3 py-1.5 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 text-sky-700 dark:text-sky-300 text-xs rounded-lg font-medium"
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
    </div>
  );
}
