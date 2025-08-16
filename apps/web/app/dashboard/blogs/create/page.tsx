"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "@repo/ui/components";
import {
  IconDeviceFloppy,
  IconArrowLeft,
  IconUpload,
  IconX,
  IconLoader,
} from "@tabler/icons-react";
import { useAuth } from "../../../../lib/auth-context";
import {
  createBlog,
  uploadBlogImage,
  BlogFormData,
} from "../../../../lib/services/blog-service";

export default function CreateBlogPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState(
    "<p>Start writing your blog post here...</p>",
  );
  const [coverImage, setCoverImage] = useState("");
  const [published, setPublished] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    // Auto-generate slug
    const newSlug = newTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setSlug(newSlug);
  };

  // Handle tag input
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Handle image upload for rich text editor
  const handleImageUpload = async (file: File) => {
    try {
      const result = await uploadBlogImage(file);
      return { imageUrl: result.imageUrl };
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  // Handle cover image upload
  const handleCoverImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadBlogImage(file);
      setCoverImage(result.imageUrl);
    } catch (error) {
      console.error("Error uploading cover image:", error);
      alert("Failed to upload cover image. Please try again.");
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !slug || !content) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create blog post data object
      const blogData: BlogFormData = {
        title,
        slug,
        content,
        excerpt: excerpt || undefined,
        coverImage: coverImage || undefined,
        published,
        tags,
      };

      // Create the blog post
      const { post } = await createBlog(blogData);

      // Redirect to the blogs list
      router.push("/dashboard/blogs");
    } catch (error: any) {
      console.error("Error creating blog post:", error);
      alert(error.message || "Failed to create blog post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-accent transition-colors"
            aria-label="Go back"
          >
            <IconArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold tracking-tight">Create New Blog</h1>
        </div>

        <div className="flex items-center gap-3">
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

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !title || !content}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 gap-2"
          >
            {isSubmitting ? (
              <div className="animate-spin w-4 h-4 border-2 border-foreground border-t-transparent rounded-full mr-1" />
            ) : (
              <IconDeviceFloppy size={16} />
            )}
            Save Blog
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Enter a catchy title"
            required
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <label htmlFor="slug" className="block text-sm font-medium">
            Slug <span className="text-destructive">*</span>
          </label>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="url-friendly-slug"
            required
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
          <p className="text-xs text-muted-foreground">
            This will be used in the URL: /blogs/{slug}
          </p>
        </div>

        {/* Cover Image */}
        <div className="relative mb-6">
          <div className="mb-2 flex justify-between items-center">
            <label htmlFor="coverImage" className="text-sm font-medium">
              Cover Image
            </label>
            <button
              type="button"
              onClick={() => setCoverImage("")}
              className="text-xs text-muted-foreground hover:text-destructive"
              disabled={!coverImage}
              aria-label="Remove cover image"
            >
              Remove
            </button>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="text"
              id="coverImage"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <label
              htmlFor="coverImageUpload"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <IconUpload size={18} className="mr-2" />
              Upload
            </label>
            <input
              type="file"
              id="coverImageUpload"
              accept="image/*"
              className="hidden"
              onChange={handleCoverImageUpload}
            />
          </div>
          {coverImage && (
            <div className="mt-2 aspect-video relative rounded-md overflow-hidden border border-border">
              <img
                src={coverImage}
                alt="Cover preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src =
                    "https://placehold.co/1200x630?text=Invalid+Image+URL";
                }}
              />
            </div>
          )}
        </div>

        {/* Excerpt */}
        <div className="space-y-2">
          <label htmlFor="excerpt" className="block text-sm font-medium">
            Excerpt
          </label>
          <textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Brief summary of your blog post"
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all min-h-[80px] max-h-40"
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label htmlFor="tags" className="block text-sm font-medium">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-primary/20"
                >
                  <IconX size={12} />
                </button>
              </span>
            ))}
          </div>
          <input
            id="tags"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Add tags (press Enter to add)"
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
        </div>

        {/* Content Editor */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Content</h3>
          <RichTextEditor
            content={content}
            onChange={setContent}
            onImageUpload={handleImageUpload}
          />
        </div>
      </form>
    </div>
  );
}
