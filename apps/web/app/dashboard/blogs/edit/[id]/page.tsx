"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "@repo/ui/components";
import { IconDeviceFloppy, IconArrowLeft, IconUpload, IconX, IconTrash } from "@tabler/icons-react";
import { useAuth } from "../../../../../lib/auth-context";

// Mock blog data for testing - in a real app, this would come from an API
const MOCK_BLOGS = [
  {
    id: "1",
    title: "Getting Started with NextJS and TypeScript",
    slug: "getting-started-nextjs-typescript",
    excerpt: "Learn how to set up a new project using NextJS and TypeScript with best practices.",
    content: "<h2>Introduction</h2><p>NextJS and TypeScript make a powerful combination for building modern web applications. In this post, we'll explore how to get started with this tech stack.</p><h2>Setting Up Your Project</h2><p>First, create a new NextJS project with TypeScript support using the following command:</p><pre><code>npx create-next-app@latest my-app --typescript</code></pre>",
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
    excerpt: "Discover how to create beautiful user interfaces quickly using Tailwind CSS.",
    content: "<h2>Introduction to Tailwind CSS</h2><p>Tailwind CSS is a utility-first CSS framework that allows you to build modern websites without ever leaving your HTML. In this guide, we'll explore the key concepts and best practices.</p>",
    coverImage: "https://images.unsplash.com/photo-1587620962725-abab7fe55159",
    published: true,
    createdAt: "2025-05-10T09:15:00Z",
    updatedAt: "2025-05-12T11:45:00Z",
    tags: ["CSS", "Tailwind", "UI Design"],
  },
  {
    id: "3",
    title: "State Management in React: A Comprehensive Guide",
    slug: "state-management-react",
    excerpt: "Explore various state management solutions for React applications.",
    content: "<h2>Introduction</h2><p>State management is a crucial aspect of React applications. In this comprehensive guide, we'll explore different state management solutions and their use cases.</p>",
    coverImage: "https://images.unsplash.com/photo-1545670723-196ed0954986",
    published: false,
    createdAt: "2025-05-05T08:45:00Z",
    updatedAt: "2025-06-01T16:30:00Z",
    tags: ["React", "State Management", "JavaScript"],
  },
];

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditBlogPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = params;
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [published, setPublished] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  
  // Fetch blog post by ID
  useEffect(() => {
    // In a real app, this would be an API call
    const blogPost = MOCK_BLOGS.find((blog) => blog.id === id);
    
    if (blogPost) {
      setTitle(blogPost.title);
      setSlug(blogPost.slug);
      setExcerpt(blogPost.excerpt || "");
      setContent(blogPost.content);
      setCoverImage(blogPost.coverImage || "");
      setPublished(blogPost.published);
      setTags(blogPost.tags || []);
      setIsLoading(false);
    } else {
      setNotFound(true);
      setIsLoading(false);
    }
  }, [id]);

  // Auto-generate slug from title if user edits title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    // Only auto-update slug if it hasn't been manually modified
    if (slug === title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")) {
      const newSlug = newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(newSlug);
    }
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
    setTags(tags.filter(tag => tag !== tagToRemove));
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
      // This would be an API call in a real app
      // For now, we'll simulate a successful API call
      console.log("Updated blog post data:", {
        id,
        title,
        slug,
        excerpt,
        content,
        coverImage,
        published,
        tags,
        userId: user?.id,
      });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to the blogs list
      router.push("/dashboard/blogs");
      
    } catch (error) {
      console.error("Error updating blog post:", error);
      alert("Failed to update blog post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle blog deletion
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this blog post? This action cannot be undone.")) {
      return;
    }
    
    try {
      // This would be an API call in a real app
      console.log("Deleting blog post:", id);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to the blogs list
      router.push("/dashboard/blogs");
      
    } catch (error) {
      console.error("Error deleting blog post:", error);
      alert("Failed to delete blog post. Please try again.");
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Blog post not found</h2>
        <p className="text-muted-foreground mb-6">
          The blog post you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => router.push("/dashboard/blogs")}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
        >
          Go Back to Blogs
        </button>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Edit Blog</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button
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
            Save Changes
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
        <div className="space-y-2">
          <label htmlFor="coverImage" className="block text-sm font-medium">
            Cover Image URL
          </label>
          <div className="flex gap-2">
            <input
              id="coverImage"
              type="text"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
            <button
              type="button"
              className="px-3 py-2 border border-border rounded-md bg-background hover:bg-accent transition-colors flex items-center gap-1"
            >
              <IconUpload size={16} /> Upload
            </button>
          </div>
          {coverImage && (
            <div className="mt-3 relative w-full h-40 rounded-md overflow-hidden border border-border">
              <img
                src={coverImage}
                alt="Cover preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/800x400?text=Invalid+Image+URL";
                }}
              />
              <button
                type="button"
                onClick={() => setCoverImage("")}
                className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background transition-colors"
                aria-label="Remove cover image"
              >
                <IconX size={16} />
              </button>
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
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Content <span className="text-destructive">*</span>
          </label>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Write your blog post content here..."
            className="min-h-[500px]"
          />
        </div>
      </form>
    </div>
  );
}
