"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "@repo/ui/components";
import {
  IconDeviceFloppy,
  IconArrowLeft,
  IconUpload,
  IconX,
  IconTrash,
} from "@tabler/icons-react";
import { useAuth } from "../../../../../lib/auth-context";
import { API_URL } from '../../../../../lib/api-config';
import { getTokens } from '../../../../../lib/auth';
import Loader from '../../../../../components/ui/loader';
import {
  getBlogById,
  getUserBlogs,
  updateBlog,
  deleteBlog,
} from "../../../../../lib/services/blog-service";

// Mock blog data for testing - in a real app, this would come from an API
const MOCK_BLOGS = [
  {
    id: "1",
    title: "Getting Started with NextJS and TypeScript",
    slug: "getting-started-nextjs-typescript",
    excerpt:
      "Learn how to set up a new project using NextJS and TypeScript with best practices.",
    content:
      "<h2>Introduction</h2><p>NextJS and TypeScript make a powerful combination for building modern web applications. In this post, we'll explore how to get started with this tech stack.</p><h2>Setting Up Your Project</h2><p>First, create a new NextJS project with TypeScript support using the following command:</p><pre><code>npx create-next-app@latest my-app --typescript</code></pre>",
    coverImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97",
    published: true,
    createdAt: "2025-05-15T10:30:00Z",
    updatedAt: "2025-05-20T14:20:00Z",
    tags: ["NextJS", "TypeScript", "Web Development"],
  },
  {
    id: "2",
    title: "Building a Modern UI with Tailwind CSS",
    slug: "building-modern-ui-tailwind",
    excerpt:
      "Discover how to create beautiful user interfaces quickly using Tailwind CSS.",
    content:
      "<h2>Introduction to Tailwind CSS</h2><p>Tailwind CSS is a utility-first CSS framework that allows you to build modern websites without ever leaving your HTML. In this guide, we'll explore the key concepts and best practices.</p>",
    coverImage: "https://images.unsplash.com/photo-1587620962725-abab7fe55159",
    published: true,
    createdAt: "2025-05-10T09:15:00Z",
    updatedAt: "2025-05-18T11:45:00Z",
    tags: ["CSS", "Tailwind", "UI Design"],
  },
];

export function BlogEditor({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();

  // State for form fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [published, setPublished] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // State for UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [imageUploading, setImageUploading] = useState(false);

  // Find blog post by ID or fallback to slug
  useEffect(() => {
    const fetchBlog = async () => {
      try {
        // First try to get from user blogs (if already cached)
        let post = null;

        try {
          // Try to fetch the blog post from the API using its ID
          post = await getBlogById(id);
        } catch (idError) {
          console.log("Failed to fetch by ID, trying to fetch by slug");
          // If ID fetch fails, try to fetch the user's blogs and find the one with matching ID
          const userBlogsResponse = await getUserBlogs();
          post = userBlogsResponse.data.find((p) => p.id === id);
        }

        if (post) {
          setTitle(post.title);
          setSlug(post.slug);
          setContent(post.content);
          setExcerpt(post.excerpt || "");
          setCoverImage(post.coverImage || "");
          setPublished(post.published);
          setTags(Array.isArray(post.tags) ? post.tags : []);
          setLoading(false);
        } else {
          // Blog post not found, redirect
          console.error("Blog post not found");
          router.push("/dashboard/blogs");
        }
      } catch (error) {
        console.error("Error fetching blog post:", error);
        setErrorMessage("Failed to load blog post. Please try again.");
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id, router]);

  // Function to add a tag
  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  // Function to handle tag input key press
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  // Function to remove a tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");

    // Validate form
    if (!title || !slug || !content) {
      setErrorMessage("Please fill in all required fields.");
      setSaving(false);
      return;
    }

    try {
      // Send the updated blog post to the API
      await updateBlog(id, {
        title,
        slug,
        content,
        excerpt,
        coverImage,
        published,
        tags,
      });

      // Redirect to blogs list page
      router.push("/dashboard/blogs");
    } catch (error) {
      console.error("Error updating blog post:", error);
      setErrorMessage("Failed to update blog post. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Function to delete the blog post
  const handleDelete = async () => {
    if (
      confirm(
        "Are you sure you want to delete this blog post? This action cannot be undone.",
      )
    ) {
      try {
        // Delete the blog post via API
        await deleteBlog(id);
        router.push("/dashboard/blogs");
      } catch (error) {
        console.error("Error deleting blog post:", error);
        alert("Failed to delete blog post. Please try again.");
      }
    }
  };

  // Function to handle cover image upload
  const handleCoverImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    setErrorMessage("");

    try {
      // In a real app, you would upload the image to your backend/storage service
      // Uncomment for real API:
      // const response = await uploadBlogImage(file);
      // const imageUrl = response.imageUrl;

      // For now, we'll just simulate a delay and use a local URL
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const imageUrl = URL.createObjectURL(file);

      setCoverImage(imageUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      setErrorMessage("Failed to upload image. Please try again.");
    } finally {
      setImageUploading(false);
    }
  };

  // Function to remove cover image
  const removeCoverImage = () => {
    setCoverImage("");
  };

  // Function to handle image upload in the rich text editor
  const handleRichTextImageUpload = async (
    file: File,
  ): Promise<{ imageUrl: string }> => {
    try {
      // In a real app, you would upload the image to your backend/storage service
      // Uncomment for real API:
      // const response = await fetch('/api/upload', {
      //   method: 'POST',
      //   body: formData
      // });
      // const data = await response.json();
      // return { imageUrl: data.imageUrl };

      // For now, we'll just simulate a delay and use a local URL
      await new Promise((resolve) => setTimeout(resolve, 800));
      const url = URL.createObjectURL(file);
      return { imageUrl: url };
    } catch (error) {
      console.error("Error uploading image to editor:", error);
      // Return a placeholder image URL on error
      return {
        imageUrl:
          "https://via.placeholder.com/800x400?text=Error+Loading+Image",
      };
    }
  };

  // Generate slug from title
  const generateSlug = () => {
    const newSlug = title
      .toLowerCase()
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, "-");
    setSlug(newSlug);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-sky-500/20 dark:bg-sky-400/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/20 dark:bg-purple-400/20 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-sky-400/10 to-indigo-400/10 dark:from-sky-500/10 dark:to-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard/blogs")}
              className="p-3 bg-slate-900/50 rounded-xl hover:bg-slate-900/70 transition-all hover:shadow-xl hover:scale-105"
              style={{backdropFilter: "blur(9.8px)", boxShadow: "rgba(0, 0, 0, 0.3) 0px 7px 29px 0px"}}
            >
              <IconArrowLeft size={20} className="text-slate-300" />
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-sky-600 dark:from-slate-100 dark:to-sky-400 bg-clip-text text-transparent">Edit Blog Post</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <IconDeviceFloppy size={20} />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500 text-red-600 dark:text-red-400 px-6 py-4 rounded-2xl mb-6">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-slate-900/50 rounded-2xl p-8 space-y-8" style={{backdropFilter: "blur(9.8px)", boxShadow: "rgba(0, 0, 0, 0.3) 0px 7px 29px 0px"}}>
          {/* Title */}
          <div className="space-y-3">
            <label htmlFor="title" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => !slug && generateSlug()}
              className="flex h-12 w-full rounded-xl border-0 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              placeholder="Enter blog post title"
              required
            />
          </div>

          {/* Slug */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="slug" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Slug <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={generateSlug}
                className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-medium"
              >
                Generate from title
              </button>
            </div>
            <input
              type="text"
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="flex h-12 w-full rounded-xl border-0 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              placeholder="enter-blog-post-slug"
              required
            />
          </div>

          {/* Excerpt */}
          <div className="space-y-3">
            <label htmlFor="excerpt" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Excerpt
            </label>
            <textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="flex w-full rounded-xl border-0 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all min-h-[100px] resize-none"
              placeholder="Brief summary of your blog post"
            />
          </div>

          {/* Cover Image */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Cover Image
            </label>

            {coverImage ? (
              <div className="relative">
                <img
                  src={coverImage}
                  alt="Blog cover"
                  className="w-full h-64 object-cover rounded-2xl"
                />
                <button
                  type="button"
                  onClick={removeCoverImage}
                  className="absolute top-3 right-3 bg-red-500 text-white rounded-xl p-2 hover:bg-red-600 transition-all shadow-lg"
                >
                  <IconX size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl h-64 bg-slate-50/50 dark:bg-slate-900/50 hover:border-sky-400 dark:hover:border-sky-500 transition-all">
                <label className="cursor-pointer flex flex-col items-center justify-center gap-3 w-full h-full">
                  <IconUpload size={32} className="text-slate-400 dark:text-slate-500" />
                  {imageUploading ? (
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Uploading...
                    </span>
                  ) : (
                    <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                      Click to upload cover image
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverImageUpload}
                    disabled={imageUploading}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Content <span className="text-red-500">*</span>
            </label>
            <div className="rounded-2xl overflow-hidden border-0">
              <RichTextEditor
                content={content}
                onChange={setContent}
                onImageUpload={handleRichTextImageUpload}
                placeholder="Write your blog post content here..."
                minHeight="400px"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <label htmlFor="tags" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center gap-2 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 text-sky-700 dark:text-sky-300 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-sky-600 dark:text-sky-400 hover:text-red-500 dark:hover:text-red-400"
                  >
                    <IconX size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyPress}
                className="flex h-12 flex-1 rounded-xl border-0 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                placeholder="Add a tag and press Enter"
              />
              <button
                type="button"
                onClick={addTag}
                className="h-12 px-6 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-sky-500/30"
              >
                Add
              </button>
            </div>
          </div>

          {/* Publication setting and delete */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-8 border-t border-slate-200 dark:border-slate-700 gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl font-medium transition-all"
              >
                <IconTrash size={18} />
                Delete
              </button>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="published"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="w-5 h-5 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500"
                />
                <label htmlFor="published" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {published ? "Published" : "Save as Draft"}
                </label>
              </div>
            </div>

            {/* Mobile save button (for responsive design) */}
            <button
              type="submit"
              disabled={saving}
              className="inline-flex sm:hidden items-center gap-2 px-8 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <IconDeviceFloppy size={20} />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
