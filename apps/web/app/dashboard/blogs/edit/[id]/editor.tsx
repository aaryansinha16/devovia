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
          console.log("Trying to fetch blog by ID:", id);
          const response = await getBlogById(id);
          post = response.post;
        } catch (idError) {
          console.log("Failed to fetch by ID, trying to fetch by slug");
          // If ID fetch fails, try to fetch the user's blogs and find the one with matching ID
          const userBlogsResponse = await getUserBlogs();
          post = userBlogsResponse.posts.find((p) => p.id === id);
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
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground">Loading blog post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/blogs")}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4"
          >
            <IconArrowLeft size={16} className="mr-2" />
            Back to Blogs
          </button>
          <h1 className="text-2xl font-bold">Edit Blog Post</h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          ) : (
            <IconDeviceFloppy size={16} />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="bg-destructive/15 border border-destructive text-destructive px-4 py-3 rounded-md mb-6">
          {errorMessage}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium leading-none">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => !slug && generateSlug()}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Enter blog post title"
            required
          />
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="slug" className="text-sm font-medium leading-none">
              Slug <span className="text-destructive">*</span>
            </label>
            <button
              type="button"
              onClick={generateSlug}
              className="text-xs text-primary hover:text-primary/80"
            >
              Generate from title
            </button>
          </div>
          <input
            type="text"
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="enter-blog-post-slug"
            required
          />
        </div>

        {/* Excerpt */}
        <div className="space-y-2">
          <label htmlFor="excerpt" className="text-sm font-medium leading-none">
            Excerpt
          </label>
          <textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px]"
            placeholder="Brief summary of your blog post"
          />
        </div>

        {/* Cover Image */}
        <div className="space-y-3">
          <label className="text-sm font-medium leading-none">
            Cover Image
          </label>

          {coverImage ? (
            <div className="relative">
              <img
                src={coverImage}
                alt="Blog cover"
                className="w-full h-48 object-cover rounded-md"
              />
              <button
                type="button"
                onClick={removeCoverImage}
                className="absolute top-2 right-2 bg-background/80 text-foreground rounded-full p-1 hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <IconX size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center border border-dashed border-input rounded-md h-48 bg-muted/50">
              <label className="cursor-pointer flex flex-col items-center justify-center gap-2 w-full h-full">
                <IconUpload size={24} className="text-muted-foreground" />
                {imageUploading ? (
                  <span className="text-sm text-muted-foreground">
                    Uploading...
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">
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
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">
            Content <span className="text-destructive">*</span>
          </label>
          <RichTextEditor
            content={content}
            onChange={setContent}
            onImageUpload={handleRichTextImageUpload}
            placeholder="Write your blog post content here..."
            minHeight="400px"
          />
        </div>

        {/* Tags */}
        <div className="space-y-3">
          <label htmlFor="tags" className="text-sm font-medium leading-none">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <div
                key={tag}
                className="flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-primary hover:text-destructive"
                >
                  <IconX size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyPress}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Add a tag and press Enter"
            />
            <button
              type="button"
              onClick={addTag}
              className="h-10 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
            >
              Add
            </button>
          </div>
        </div>

        {/* Publication setting and delete */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-6 border-t gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 border border-destructive bg-background hover:bg-destructive/10 text-destructive h-10 py-2 px-4 gap-2"
            >
              <IconTrash size={16} />
              Delete
            </button>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
              />
              <label htmlFor="published" className="text-sm font-medium">
                {published ? "Published" : "Save as Draft"}
              </label>
            </div>
          </div>

          {/* Mobile save button (for responsive design) */}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex sm:hidden items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <IconDeviceFloppy size={16} />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
