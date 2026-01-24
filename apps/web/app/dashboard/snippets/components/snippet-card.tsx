"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GlassCard, Text } from "@repo/ui";
import {
  IconCopy,
  IconEdit,
  IconTrash,
  IconShare,
  IconTag,
  IconCalendar,
  IconCheck,
} from "@tabler/icons-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface SnippetCardProps {
  snippet: {
    id: string;
    title: string;
    description?: string;
    code: string;
    language: string;
    tags: string[];
    createdAt: string;
    isPublic: boolean;
  };
  viewMode: "grid" | "list";
  onDelete: () => void;
  onEdit: () => void;
}

export function SnippetCard({ snippet, viewMode, onDelete, onEdit }: SnippetCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/snippets/${snippet.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Share link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy share link:", error);
    }
  };

  const getLanguageLabel = (lang: string) => {
    const labels: Record<string, string> = {
      javascript: "JavaScript",
      typescript: "TypeScript",
      python: "Python",
      java: "Java",
      go: "Go",
      rust: "Rust",
      cpp: "C++",
      csharp: "C#",
      php: "PHP",
      ruby: "Ruby",
      swift: "Swift",
      kotlin: "Kotlin",
    };
    return labels[lang] || lang;
  };

  const codePreview = snippet.code.split("\n").slice(0, 5).join("\n");

  return (
    <GlassCard className="group hover:shadow-2xl transition-all duration-300">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <Link href={`/dashboard/snippets/${snippet.id}`}>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1">
                {snippet.title}
              </h3>
            </Link>
            {snippet.description && (
              <Text size="sm" variant="muted" className="mt-1 line-clamp-2">
                {snippet.description}
              </Text>
            )}
          </div>
        </div>

        {/* Language Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-1 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-700 dark:text-sky-300 rounded text-xs font-medium">
            {getLanguageLabel(snippet.language)}
          </span>
          {snippet.isPublic && (
            <span className="px-2 py-1 bg-green-500/20 text-green-700 dark:text-green-300 rounded text-xs font-medium">
              Public
            </span>
          )}
        </div>

        {/* Code Preview */}
        <div className="mb-3 rounded-lg overflow-hidden bg-slate-900 flex-1">
          <SyntaxHighlighter
            language={snippet.language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: "12px",
              fontSize: "12px",
              maxHeight: viewMode === "grid" ? "150px" : "200px",
              overflow: "hidden",
            }}
            showLineNumbers={false}
          >
            {codePreview}
          </SyntaxHighlighter>
          {snippet.code.split("\n").length > 5 && (
            <div className="px-3 py-1 bg-slate-800 text-slate-400 text-xs text-center">
              +{snippet.code.split("\n").length - 5} more lines
            </div>
          )}
        </div>

        {/* Tags */}
        {snippet.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {snippet.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-xs flex items-center gap-1"
              >
                <IconTag className="w-3 h-3" />
                {tag}
              </span>
            ))}
            {snippet.tags.length > 3 && (
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-xs">
                +{snippet.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <IconCalendar className="w-3 h-3" />
            {new Date(snippet.createdAt).toLocaleDateString()}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-all"
              title="Copy code"
            >
              {copied ? (
                <IconCheck className="w-4 h-4 text-green-500" />
              ) : (
                <IconCopy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleShare}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-all"
              title="Share"
            >
              <IconShare className="w-4 h-4" />
            </button>
            <button
              onClick={onEdit}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-all"
              title="Edit"
            >
              <IconEdit className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
              title="Delete"
            >
              <IconTrash className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
