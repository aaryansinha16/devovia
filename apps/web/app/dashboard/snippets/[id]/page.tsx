"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Heading,
  Text,
  GlassCard,
  Button,
  BackgroundDecorative,
} from "@repo/ui";
import {
  IconArrowLeft,
  IconCopy,
  IconEdit,
  IconTrash,
  IconShare,
  IconTag,
  IconCalendar,
  IconCheck,
  IconUser,
} from "@tabler/icons-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { API_URL } from "../../../../lib/api-config";
import { getTokens } from "../../../../lib/auth";

export default function SnippetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [snippet, setSnippet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchSnippet();
    }
  }, [params.id]);

  const fetchSnippet = async () => {
    try {
      setLoading(true);
      const tokens = getTokens();
      if (!tokens?.accessToken) {
        router.push("/dashboard/snippets");
        return;
      }

      const response = await fetch(`${API_URL}/snippets/${params.id}`, {
        headers: {
          "Authorization": `Bearer ${tokens.accessToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSnippet(data.snippet);
      } else {
        router.push("/dashboard/snippets");
      }
    } catch (error) {
      console.error("Error fetching snippet:", error);
      router.push("/dashboard/snippets");
    } finally {
      setLoading(false);
    }
  };

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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this snippet?")) return;

    try {
      const tokens = getTokens();
      if (!tokens?.accessToken) return;

      const response = await fetch(`${API_URL}/snippets/${params.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.ok) {
        router.push("/dashboard/snippets");
      }
    } catch (error) {
      console.error("Error deleting snippet:", error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!snippet) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 relative overflow-hidden">
      <BackgroundDecorative variant="subtle" />

      <Container className="relative z-10 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<IconArrowLeft className="w-4 h-4" />}
            onClick={() => router.push("/dashboard/snippets")}
            className="mb-4"
          >
            Back to Snippets
          </Button>

          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
            <div className="flex-1">
              <Heading size="h1" variant="gradient" spacing="sm">
                {snippet.title}
              </Heading>
              {snippet.description && (
                <Text variant="muted" className="mt-2">
                  {snippet.description}
                </Text>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                leftIcon={copied ? <IconCheck className="w-5 h-5" /> : <IconCopy className="w-5 h-5" />}
                onClick={handleCopy}
              >
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button
                variant="secondary"
                size="md"
                leftIcon={<IconShare className="w-5 h-5" />}
                onClick={handleShare}
              >
                Share
              </Button>
              <Button
                variant="secondary"
                size="md"
                leftIcon={<IconEdit className="w-5 h-5" />}
                onClick={() => router.push(`/dashboard/snippets/${snippet.id}/edit`)}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                size="md"
                leftIcon={<IconTrash className="w-5 h-5" />}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <GlassCard className="mb-6">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <IconUser className="w-5 h-5 text-slate-500" />
              <Text size="sm">
                <span className="text-slate-500">By:</span>{" "}
                <span className="font-medium">{snippet.user?.name || snippet.user?.username}</span>
              </Text>
            </div>
            <div className="flex items-center gap-2">
              <IconCalendar className="w-5 h-5 text-slate-500" />
              <Text size="sm">
                <span className="text-slate-500">Created:</span>{" "}
                <span className="font-medium">
                  {new Date(snippet.createdAt).toLocaleDateString()}
                </span>
              </Text>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-700 dark:text-sky-300 rounded-lg text-sm font-medium">
                {getLanguageLabel(snippet.language)}
              </span>
              {snippet.isPublic && (
                <span className="px-3 py-1 bg-green-500/20 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium">
                  Public
                </span>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Tags */}
        {snippet.tags && snippet.tags.length > 0 && (
          <GlassCard className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <IconTag className="w-5 h-5 text-slate-500" />
              <Text size="sm" className="font-medium text-slate-700 dark:text-slate-300">
                Tags
              </Text>
            </div>
            <div className="flex flex-wrap gap-2">
              {snippet.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Code */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <Text size="sm" className="font-medium text-slate-700 dark:text-slate-300">
              Code
            </Text>
            <Text size="sm" variant="muted">
              {snippet.code.split("\n").length} lines
            </Text>
          </div>
          <div className="rounded-lg overflow-hidden bg-slate-900">
            <SyntaxHighlighter
              language={snippet.language}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: "20px",
                fontSize: "14px",
              }}
              showLineNumbers={true}
            >
              {snippet.code}
            </SyntaxHighlighter>
          </div>
        </GlassCard>
      </Container>
    </div>
  );
}
