"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { useSnippetById, useUpdateSnippet } from '../../../../../lib/hooks/useSnippet';
import { useToast } from '@repo/ui/hooks/use-toast';
import Loader from '../../../../../components/ui/loader';

export default function EditSnippetPage() {
  const params = useParams();
  const router = useRouter();
  const snippetId = params.id as string;

  const { data: snippet, loading, error } = useSnippetById(snippetId);
  const { mutate: updateSnippet, loading: saving } = useUpdateSnippet(snippetId);
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (snippet) {
      setTitle(snippet.title);
      setDescription(snippet.description || "");
      setCode(snippet.code);
      setLanguage(snippet.language);
      setTags(snippet.tags || []);
      setIsPublic(snippet.visibility === 'PUBLIC');
    }
  }, [snippet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateSnippet({
        title,
        description,
        code,
        language,
        tags,
        visibility: isPublic ? 'PUBLIC' : 'PRIVATE',
      });

      toast({
        title: "Success!",
        description: "Snippet updated successfully",
      });

      router.push(`/dashboard/snippets/${snippetId}`);
    } catch (error: any) {
      console.error("Error updating snippet:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update snippet",
      });
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

  if (loading) {
    return <Loader />;
  }

  if (error || !snippet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Heading size="h2" className="mb-4">Error loading snippet</Heading>
          <Text className="text-slate-400 mb-6">{error?.message || "Snippet not found"}</Text>
          <Button onClick={() => router.push("/dashboard/snippets")}>Back to Snippets</Button>
        </div>
      </div>
    );
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
            onClick={() => router.back()}
            className="mb-4"
          >
            Back
          </Button>
          <Heading size="h1" variant="gradient" spacing="sm">
            Edit Snippet
          </Heading>
          <Text variant="muted">Update your code snippet</Text>
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
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
                disabled={saving || !title || !code}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </GlassCard>
      </Container>
    </div>
  );
}
