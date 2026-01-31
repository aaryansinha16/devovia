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
      await createBlog(blogData);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-sky-500/20 dark:bg-sky-400/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/20 dark:bg-purple-400/20 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-sky-400/10 to-indigo-400/10 dark:from-sky-500/10 dark:to-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-3 bg-slate-900/50 rounded-xl hover:bg-slate-900/70 transition-all hover:shadow-xl hover:scale-105"
            style={{backdropFilter: "blur(9.8px)", boxShadow: "rgba(0, 0, 0, 0.3) 0px 7px 29px 0px"}}
            aria-label="Go back"
          >
            <IconArrowLeft size={20} className="text-slate-300" />
          </button>
        </div>
        
        <BlogCreationStepper
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
