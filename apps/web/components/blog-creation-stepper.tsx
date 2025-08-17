"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FansyInput, FansyLabel, RichTextEditor } from "@repo/ui/components";
import {
  IconArrowRight,
  IconArrowLeft,
  IconCheck,
  IconUpload,
  IconX,
  IconEye,
  IconDeviceFloppy,
  IconLoader,
  IconPhoto,
  IconFileText,
  IconTags,
  IconSettings,
} from "@tabler/icons-react";
import { uploadBlogImage, BlogFormData } from "../lib/services/blog-service";

interface BlogCreationStepperProps {
  onSubmit: (data: BlogFormData) => Promise<void>;
  isSubmitting?: boolean;
}

interface StepConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: StepConfig[] = [
  {
    id: "title",
    title: "Blog Title",
    description: "Give your blog post a compelling title",
    icon: <IconFileText className="w-5 h-5" />,
  },
  {
    id: "cover",
    title: "Cover Image",
    description: "Add a stunning cover image to grab attention",
    icon: <IconPhoto className="w-5 h-5" />,
  },
  {
    id: "excerpt",
    title: "Excerpt",
    description: "Write a brief summary of your blog post",
    icon: <IconEye className="w-5 h-5" />,
  },
  {
    id: "tags",
    title: "Tags",
    description: "Add relevant tags to help readers find your content",
    icon: <IconTags className="w-5 h-5" />,
  },
  {
    id: "content",
    title: "Content",
    description: "Write your amazing blog post content",
    icon: <IconFileText className="w-5 h-5" />,
  },
  {
    id: "settings",
    title: "Settings",
    description: "Configure publication settings",
    icon: <IconSettings className="w-5 h-5" />,
  },
];

export function BlogCreationStepper({ onSubmit, isSubmitting = false }: BlogCreationStepperProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "<p>Start writing your blog post here...</p>",
    coverImage: "",
    published: false,
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title) {
      const newSlug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setFormData(prev => ({ ...prev, slug: newSlug }));
    }
  }, [formData.title]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Title
        return formData.title.trim().length > 0;
      case 1: // Cover (optional)
        return true;
      case 2: // Excerpt (optional)
        return true;
      case 3: // Tags (optional)
        return true;
      case 4: // Content
        return formData.content.trim().length > 20; // More than just the placeholder
      case 5: // Settings
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        updateFormData("tags", [...formData.tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateFormData("tags", formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadBlogImage(file);
      updateFormData("coverImage", result.imageUrl);
    } catch (error) {
      console.error("Error uploading cover image:", error);
      alert("Failed to upload cover image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const result = await uploadBlogImage(file);
      return { imageUrl: result.imageUrl };
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;
    
    const blogData: BlogFormData = {
      title: formData.title,
      slug: formData.slug,
      content: formData.content,
      excerpt: formData.excerpt || undefined,
      coverImage: formData.coverImage || undefined,
      published: formData.published,
      tags: formData.tags,
    };

    await onSubmit(blogData);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Title
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div>
                <FansyLabel htmlFor="title" className="text-lg font-semibold mb-3 block">
                  What's your blog post title?
                </FansyLabel>
                <FansyInput
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateFormData("title", e.target.value)}
                  placeholder="Enter an engaging title for your blog post..."
                  className="text-lg h-14"
                  autoFocus
                />
              </div>
              
              {formData.title && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <FansyLabel className="text-sm text-muted-foreground">
                    URL Slug (auto-generated)
                  </FansyLabel>
                  <div className="p-3 bg-muted rounded-lg border">
                    <code className="text-sm text-primary">
                      /blogs/{formData.slug}
                    </code>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        );

      case 1: // Cover Image
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <FansyLabel className="text-lg font-semibold">
                Add a cover image (optional)
              </FansyLabel>
              
              <div className="space-y-4">
                <FansyInput
                  type="text"
                  value={formData.coverImage}
                  onChange={(e) => updateFormData("coverImage", e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="h-12"
                />
                
                <div className="flex items-center gap-4">
                  <div className="flex-1 border-t border-border"></div>
                  <span className="text-sm text-muted-foreground">or</span>
                  <div className="flex-1 border-t border-border"></div>
                </div>
                
                <label
                  htmlFor="coverImageUpload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  {isUploading ? (
                    <IconLoader className="w-8 h-8 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <IconUpload className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload an image
                      </span>
                    </>
                  )}
                </label>
                <input
                  type="file"
                  id="coverImageUpload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverImageUpload}
                  disabled={isUploading}
                />
              </div>
              
              {formData.coverImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative aspect-video rounded-lg overflow-hidden border border-border"
                >
                  <img
                    src={formData.coverImage}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://placehold.co/1200x630?text=Invalid+Image+URL";
                    }}
                  />
                  <button
                    onClick={() => updateFormData("coverImage", "")}
                    className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                  >
                    <IconX className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        );

      case 2: // Excerpt
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <FansyLabel htmlFor="excerpt" className="text-lg font-semibold">
                Write a brief excerpt (optional)
              </FansyLabel>
              <textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => updateFormData("excerpt", e.target.value)}
                placeholder="A compelling summary that will make readers want to read more..."
                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all min-h-[120px] resize-none"
                autoFocus
              />
              <div className="text-sm text-muted-foreground">
                {formData.excerpt.length}/200 characters
              </div>
            </div>
          </motion.div>
        );

      case 3: // Tags
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <FansyLabel htmlFor="tags" className="text-lg font-semibold">
                Add relevant tags (optional)
              </FansyLabel>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <motion.span
                      key={tag}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
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
                    </motion.span>
                  ))}
                </div>
              )}
              
              <FansyInput
                id="tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Type a tag and press Enter to add..."
                className="h-12"
                autoFocus
              />
              
              <div className="text-sm text-muted-foreground">
                Press Enter to add tags. Good tags help readers discover your content.
              </div>
            </div>
          </motion.div>
        );

      case 4: // Content
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <FansyLabel className="text-lg font-semibold">
                Write your blog content
              </FansyLabel>
              <div className="border border-border rounded-lg overflow-hidden">
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => updateFormData("content", content)}
                  onImageUpload={handleImageUpload}
                />
              </div>
            </div>
          </motion.div>
        );

      case 5: // Settings
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-6">
              <FansyLabel className="text-lg font-semibold">
                Publication Settings
              </FansyLabel>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h3 className="font-medium">Publish immediately</h3>
                    <p className="text-sm text-muted-foreground">
                      Make this blog post visible to everyone
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.published}
                      onChange={(e) => updateFormData("published", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-medium mb-2">Preview</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Title:</strong> {formData.title || "Untitled"}</div>
                    <div><strong>Slug:</strong> /blogs/{formData.slug || "untitled"}</div>
                    <div><strong>Status:</strong> {formData.published ? "Published" : "Draft"}</div>
                    <div><strong>Tags:</strong> {formData.tags.length > 0 ? formData.tags.join(", ") : "None"}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Create New Blog Post</h1>
          <div className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2 mb-6">
          <motion.div
            className="bg-primary h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        
        {/* Step Indicators */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center">
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  index <= currentStep
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border text-muted-foreground"
                }`}
                whileHover={{ scale: 1.05 }}
              >
                {index < currentStep ? (
                  <IconCheck className="w-5 h-5" />
                ) : (
                  step.icon
                )}
              </motion.div>
              <div className="mt-2 text-center">
                <div className="text-xs font-medium">{step.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="mb-8">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold mb-2">{steps[currentStep]?.title}</h2>
          <p className="text-muted-foreground">{steps[currentStep]?.description}</p>
        </div>
        
        <AnimatePresence mode="wait">
          <div key={currentStep}>
            {renderStepContent()}
          </div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <IconArrowLeft className="w-4 h-4" />
          Previous
        </button>
        
        {currentStep === steps.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={!canProceed() || isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <IconLoader className="w-4 h-4 animate-spin" />
            ) : (
              <IconDeviceFloppy className="w-4 h-4" />
            )}
            {isSubmitting ? "Creating..." : "Create Blog Post"}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <IconArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
