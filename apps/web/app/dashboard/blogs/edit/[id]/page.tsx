"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import { BlogEditor } from "./editor";

// Loading component for Suspense
function EditBlogLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-sky-500/20 dark:bg-sky-400/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/20 dark:bg-purple-400/20 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center items-center min-h-[60vh]">
        <div className="text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-12 shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-sky-600 dark:from-slate-100 dark:to-sky-400 bg-clip-text text-transparent">Loading blog editor...</h2>
        </div>
      </div>
    </div>
  );
}

// Content component with useParams
function EditBlogContent() {
  // Use the useParams hook to access route parameters
  const params = useParams();
  const id = params.id as string;

  return <BlogEditor id={id} />;
}

// Main component with Suspense boundary
export default function EditBlogPage() {
  return (
    <Suspense fallback={<EditBlogLoading />}>
      <EditBlogContent />
    </Suspense>
  );
}
