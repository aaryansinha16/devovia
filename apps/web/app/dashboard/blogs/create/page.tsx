"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";
import { useAuth } from "../../../../lib/auth-context";
import {
  createBlog,
  BlogFormData,
} from "../../../../lib/services/blog-service";
import { BlogCreationStepper } from "../../../../components/blog-creation-stepper";

export default function CreateBlogPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission
  const handleSubmit = async (blogData: BlogFormData) => {
    if (!blogData.title || !blogData.slug || !blogData.content) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
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
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-accent transition-colors"
          aria-label="Go back"
        >
          <IconArrowLeft size={20} />
        </button>
      </div>
      
      <BlogCreationStepper
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
