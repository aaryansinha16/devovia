"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Heading,
  Text,
  GlassCard,
  Button,
  BackgroundDecorative,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import {
  IconPlus,
  IconSearch,
  IconLayoutGrid,
  IconLayoutList,
  IconCode,
  IconFilter,
  IconGridDots,
  IconList,
  IconCopy,
  IconEdit,
  IconTrash,
  IconShare,
  IconTag,
} from "@tabler/icons-react";
import { SnippetCard } from "./components/snippet-card";
import { useAuth } from "../../../lib/auth-context";
import { API_URL } from "../../../lib/api-config";
import { getTokens } from "../../../lib/auth";

export default function SnippetsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [snippets, setSnippets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");

  useEffect(() => {
    fetchSnippets();
  }, [searchQuery, selectedLanguage, selectedTag]);

  const fetchSnippets = async () => {
    try {
      setLoading(true);
      const tokens = getTokens();
      if (!tokens?.accessToken) {
        setSnippets([]);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedLanguage !== "all") params.append("language", selectedLanguage);
      if (selectedTag !== "all") params.append("tag", selectedTag);

      const response = await fetch(`${API_URL}/snippets?${params.toString()}`, {
        headers: {
          "Authorization": `Bearer ${tokens.accessToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSnippets(data.snippets || []);
      }
    } catch (error) {
      console.error("Error fetching snippets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSnippet = () => {
    router.push("/dashboard/snippets/create");
  };

  const handleDeleteSnippet = async (id: string) => {
    if (!confirm("Are you sure you want to delete this snippet?")) return;

    try {
      const tokens = getTokens();
      if (!tokens?.accessToken) return;

      const response = await fetch(`${API_URL}/snippets/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.ok) {
        fetchSnippets();
      }
    } catch (error) {
      console.error("Error deleting snippet:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 relative overflow-hidden">
      <BackgroundDecorative variant="subtle" />

      <Container className="relative z-10 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8">
          <div>
            <Heading size="h1" variant="gradient" spacing="sm">
              Code Snippets
            </Heading>
            <Text variant="muted">
              Save and organize your code snippets with syntax highlighting
            </Text>
          </div>
          <Button
            variant="gradient"
            size="md"
            leftIcon={<IconPlus className="w-5 h-5" />}
            onClick={handleCreateSnippet}
          >
            New Snippet
          </Button>
        </div>

        {/* Filters and Search */}
        <GlassCard className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
              <input
                type="text"
                placeholder="Search snippets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-0 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              />
            </div>

            {/* Language Filter */}
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Languages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="go">Go</SelectItem>
                <SelectItem value="rust">Rust</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="csharp">C#</SelectItem>
                <SelectItem value="php">PHP</SelectItem>
                <SelectItem value="ruby">Ruby</SelectItem>
                <SelectItem value="swift">Swift</SelectItem>
                <SelectItem value="kotlin">Kotlin</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "secondary"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <IconGridDots className="w-5 h-5" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "secondary"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <IconList className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* Snippets Grid/List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : snippets.length === 0 ? (
          <GlassCard className="text-center py-20">
            <IconCode className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <Heading size="h3" className="mb-2">
              No snippets yet
            </Heading>
            <Text variant="muted" className="mb-6">
              Create your first code snippet to get started
            </Text>
            <Button variant="gradient" onClick={handleCreateSnippet}>
              Create Snippet
            </Button>
          </GlassCard>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                : "flex flex-col gap-4"
            }
          >
            {snippets.map((snippet) => (
              <SnippetCard
                key={snippet.id}
                snippet={snippet}
                viewMode={viewMode}
                onDelete={() => handleDeleteSnippet(snippet.id)}
                onEdit={() => router.push(`/dashboard/snippets/${snippet.id}/edit`)}
              />
            ))}
          </div>
        )}
      </Container>

    </div>
  );
}
