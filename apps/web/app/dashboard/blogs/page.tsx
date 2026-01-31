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
  type BlogPost,
} from "../../../lib/services/blog-service";
import { Container, Heading, Text, EmptyState, BackgroundDecorative, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button, GlassCard } from "@repo/ui";

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
        const result = await getUserBlogs();
        setBlogs(result.data);
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
      <BackgroundDecorative variant="subtle" />
      <Container className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-10">
          <div>
            <Heading size="h1" variant="gradient" spacing="sm">
              Your Blogs
            </Heading>
            <Text>
              Manage and create your blog content
            </Text>
          </div>

          <div className="flex items-center gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px] bg-slate-900/50 rounded-xl">
                <SelectValue placeholder="All Posts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Posts</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="drafts">Drafts</SelectItem>
              </SelectContent>
            </Select>

            <Button
              href="/dashboard/blogs/create"
              variant="gradient"
              size="md"
              leftIcon={<IconPlus size={18} />}
            >
              Create Blog
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <IconLoader2 className="w-8 h-8 animate-spin text-sky-500" />
          </div>
        ) : error ? (
          <div className="p-6 text-center bg-red-50 dark:bg-red-900/20 rounded-2xl shadow-lg shadow-red-200/50 dark:shadow-red-900/50">
            <p className="text-red-600 dark:text-red-400 mb-3">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="link"
              size="sm"
            >
              Try again
            </Button>
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-16 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl shadow-xl">
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
              <GlassCard
                key={blog.id}
                className="group p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]"
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
                    <Button
                      onClick={() => handleDelete(blog.id)}
                      variant="icon"
                      className="hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete"
                    >
                      <IconTrash size={18} />
                    </Button>
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
              </GlassCard>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
