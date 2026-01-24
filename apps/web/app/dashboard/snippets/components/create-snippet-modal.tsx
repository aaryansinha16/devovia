"use client";

import React, { useState } from "react";
import { Button, Input, Label, Textarea } from "@repo/ui";
import { IconX, IconPlus } from "@tabler/icons-react";
import Editor from "@monaco-editor/react";

interface CreateSnippetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateSnippetModal({ isOpen, onClose, onSuccess }: CreateSnippetModalProps) {
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
      const response = await fetch("/api/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        resetForm();
        onSuccess();
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

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCode("");
    setLanguage("javascript");
    setTags([]);
    setTagInput("");
    setIsPublic(false);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Create New Snippet
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
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
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              required
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
              <option value="cpp">C++</option>
              <option value="csharp">C#</option>
              <option value="php">PHP</option>
              <option value="ruby">Ruby</option>
              <option value="swift">Swift</option>
              <option value="kotlin">Kotlin</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="sql">SQL</option>
              <option value="bash">Bash</option>
              <option value="json">JSON</option>
              <option value="yaml">YAML</option>
            </select>
          </div>

          {/* Code Editor */}
          <div>
            <Label htmlFor="code">Code *</Label>
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <Editor
                height="300px"
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
                }}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2 mb-2">
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
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-lg text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-600 dark:hover:text-red-400"
                    >
                      <IconX className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Public Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 text-sky-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-sky-500"
            />
            <Label htmlFor="isPublic" className="cursor-pointer">
              Make this snippet public (anyone with the link can view)
            </Label>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="gradient"
            onClick={handleSubmit}
            disabled={loading || !title || !code}
          >
            {loading ? "Creating..." : "Create Snippet"}
          </Button>
        </div>
      </div>
    </div>
  );
}
