"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "../../lib/utils";

// Editor toolbar button
const ToolbarButton = ({
  onClick,
  active = false,
  disabled = false,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "p-2 rounded-md transition-colors text-foreground",
        active && "bg-primary text-primary-foreground",
        !active && "hover:bg-accent hover:text-accent-foreground",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      {children}
    </button>
  );
};

export interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  editorClassName?: string;
  minHeight?: string;
  onImageUpload?: (file: File) => Promise<{ imageUrl: string }>;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = "Write something…",
  className,
  editorClassName,
  minHeight = "300px",
  onImageUpload,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update content when it changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  // Image upload handler
  const addImage = useCallback(() => {
    // If we have an image upload handler, use that
    if (onImageUpload) {
      // Create a hidden file input
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";

      // When file is selected, upload it and insert the image
      input.onchange = async (event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (file && editor) {
          try {
            // Show loading state or indicator here if needed

            // Upload the image and get the URL
            const { imageUrl } = await onImageUpload(file);

            // Insert the image
            editor.chain().focus().setImage({ src: imageUrl }).run();
          } catch (error) {
            console.error("Image upload failed:", error);
            alert("Failed to upload image. Please try again.");
          }
        }
      };

      // Trigger file selection
      input.click();
    } else {
      // Fallback to URL prompt if no upload handler is provided
      const url = window.prompt("Image URL");

      if (url && editor) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    }
  }, [editor, onImageUpload]);

  // Add link handler
  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!isMounted) {
    return null;
  }

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("border border-border rounded-md", className)}>
      <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-card">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="4" x2="10" y2="4" />
            <line x1="14" y1="20" x2="5" y2="20" />
            <line x1="15" y1="4" x2="9" y2="20" />
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <path d="M16 6C16 4.89543 15.1046 4 14 4H9C7.89543 4 7 4.89543 7 6V10" />
            <path d="M8 16C8 17.1046 8.89543 18 10 18H15C16.1046 18 17 17.1046 17 16V14" />
          </svg>
        </ToolbarButton>

        <div className="h-6 w-px bg-border mx-1"></div>

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          active={editor.isActive("heading", { level: 1 })}
        >
          <span className="font-bold">H1</span>
        </ToolbarButton>

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive("heading", { level: 2 })}
        >
          <span className="font-bold">H2</span>
        </ToolbarButton>

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          active={editor.isActive("heading", { level: 3 })}
        >
          <span className="font-bold">H3</span>
        </ToolbarButton>

        <div className="h-6 w-px bg-border mx-1"></div>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="9" y1="6" x2="20" y2="6" />
            <line x1="9" y1="12" x2="20" y2="12" />
            <line x1="9" y1="18" x2="20" y2="18" />
            <circle cx="4" cy="6" r="2" />
            <circle cx="4" cy="12" r="2" />
            <circle cx="4" cy="18" r="2" />
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <path d="M4 6h1v4" />
            <path d="M4 10h2" />
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
          </svg>
        </ToolbarButton>

        <div className="h-6 w-px bg-border mx-1"></div>

        <ToolbarButton onClick={setLink} active={editor.isActive("link")}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </ToolbarButton>

        <ToolbarButton onClick={addImage}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </ToolbarButton>
      </div>

      <EditorContent
        editor={editor}
        className={cn(
          "prose dark:prose-invert max-w-none p-4 focus:outline-none",
          "prose-headings:mb-3 prose-headings:mt-4 prose-headings:text-foreground",
          "prose-p:text-foreground prose-li:text-foreground",
          "prose-code:bg-accent prose-code:p-1 prose-code:rounded prose-code:text-foreground",
          "prose-blockquote:border-l-primary",
          editorClassName,
        )}
        style={{ minHeight }}
      />
    </div>
  );
};
