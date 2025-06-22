"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import { BlogEditor } from "./editor";

// Loading component for Suspense
function EditBlogLoading() {
  return (
    <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[60vh]">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Loading blog editor...</h2>
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
