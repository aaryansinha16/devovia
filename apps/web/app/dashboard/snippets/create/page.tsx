"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Heading,
  Text,
  GlassCard,
  Button,
  Input,
  Label,
  Textarea,
  BackgroundDecorative,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { IconArrowLeft, IconPlus, IconX } from "@tabler/icons-react";
import Editor from "@monaco-editor/react";
import { API_URL } from "../../../../lib/api-config";
import { getTokens } from "../../../../lib/auth";

export default function CreateSnippetPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tokens = getTokens();
      if (!tokens?.accessToken) {
        alert("Please log in to create snippets");
        return;
      }

      const response = await fetch(`${API_URL}/snippets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({
          title,
          description,
          code,
          language,
          tags,
          isPublic,
        }),
      });

      if (response.ok) {
        router.push("/dashboard/snippets");
      } else {
        alert("Failed to create snippet");
      }
    } catch (error) {
      console.error("Error creating snippet:", error);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

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
            onClick={() => router.back()}
            className="mb-4"
          >
            Back to Snippets
          </Button>
          <Heading size="h1" variant="gradient" spacing="sm">
            Create New Snippet
          </Heading>
          <Text variant="muted">
            Save your code snippet with syntax highlighting and tags
          </Text>
        </div>

        {/* Form */}
        <GlassCard>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., React Custom Hook for API Calls"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this snippet does..."
                rows={3}
              />
            </div>

            {/* Language */}
            <div>
              <Label htmlFor="language">Language *</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
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
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="css">CSS</SelectItem>
                  <SelectItem value="sql">SQL</SelectItem>
                  <SelectItem value="bash">Bash</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="yaml">YAML</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Code Editor */}
            <div>
              <Label htmlFor="code">Code *</Label>
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden mt-2">
                <Editor
                  height="400px"
                  language={language}
                  value={code}
                  onChange={(value) => setCode(value || "")}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    padding: { top: 16, bottom: 16 },
                  }}
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add a tag..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddTag}
                  leftIcon={<IconPlus className="w-4 h-4" />}
                >
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-lg text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <IconX className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Public Toggle */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 text-sky-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-sky-500"
              />
              <Label htmlFor="isPublic" className="cursor-pointer mb-0">
                Make this snippet public (anyone with the link can view)
              </Label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 pb-6 border-t border-slate-200 dark:border-slate-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
                disabled={loading || !title || !code}
              >
                {loading ? "Creating..." : "Create Snippet"}
              </Button>
            </div>
          </form>
        </GlassCard>
      </Container>
    </div>
  );
}
