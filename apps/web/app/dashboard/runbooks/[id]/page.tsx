"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { IconArrowLeft, IconPlayerPlay, IconLoader2, IconLayoutGrid, IconList } from "@tabler/icons-react";
import {
  getRunbook,
  updateRunbook,
  executeRunbook,
  type RunbookStep,
} from "../../../../lib/services/runbooks-service";

// Dynamic import to avoid SSR issues with ReactFlow
const RunbookFlowEditor = dynamic(
  () => import("../../../../components/runbooks/editor/RunbookFlowEditor").then((mod) => mod.RunbookFlowEditor),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[600px] flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-2xl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    )
  }
);

const FormBasedEditor = dynamic(
  () => import("../../../../components/runbooks/editor/FormBasedEditor").then((mod) => mod.FormBasedEditor),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    )
  }
);

export default function EditRunbookPage() {
  const params = useParams();
  const router = useRouter();
  const runbookId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE" | "ARCHIVED" | "DEPRECATED">("ACTIVE");
  const [environment, setEnvironment] = useState<"DEVELOPMENT" | "STAGING" | "PRODUCTION">("DEVELOPMENT");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [steps, setSteps] = useState<RunbookStep[]>([]);
  const [editorMode, setEditorMode] = useState<"workflow" | "form">("workflow");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    loadRunbook();
  }, [runbookId]);

  async function loadRunbook() {
    try {
      setLoading(true);
      const runbook = await getRunbook(runbookId);
      setName(runbook.name);
      setDescription(runbook.description || "");
      setStatus(runbook.status);
      setEnvironment(runbook.environment);
      setTags(runbook.tags || []);
      setSteps(runbook.steps || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load runbook";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function addTag() {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (steps.length === 0) {
      setError("At least one step is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await updateRunbook(runbookId, {
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        environment,
        tags,
        steps,
      });

      router.push("/dashboard/runbooks");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update runbook";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleExecute() {
    try {
      setExecuting(true);
      const execution = await executeRunbook(runbookId);
      router.push(`/dashboard/runbooks/executions/${execution.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to execute runbook";
      setError(message);
    } finally {
      setExecuting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-sky-500/20 dark:bg-sky-400/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/20 dark:bg-purple-400/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            aria-label="Go back"
          >
            <IconArrowLeft size={20} className="text-slate-700 dark:text-slate-300" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-sky-600 dark:from-slate-100 dark:to-sky-400 bg-clip-text text-transparent">
              Edit Runbook
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mt-1">Update your automation workflow</p>
          </div>
          <div className="flex items-center gap-3">
            {status === "ACTIVE" && (
              <button
                onClick={handleExecute}
                disabled={executing}
                className="px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {executing ? (
                  <IconLoader2 size={18} className="animate-spin" />
                ) : (
                  <IconPlayerPlay size={18} />
                )}
                {executing ? "Executing..." : "Execute"}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-500">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Basic Info Section */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Deploy to Production"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
                <option value="DEPRECATED">Deprecated</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Environment</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as "DEVELOPMENT" | "STAGING" | "PRODUCTION")}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="DEVELOPMENT">Development</option>
                <option value="STAGING">Staging</option>
                <option value="PRODUCTION">Production</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this runbook does..."
                rows={2}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tags</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Add tag..."
                  className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  onClick={addTag}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition-all"
                >
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <span key={tag} className="px-3 py-1.5 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 text-sky-700 dark:text-sky-300 text-sm rounded-lg font-medium flex items-center gap-1">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-600 dark:hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Visual Editor Section */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Workflow Editor</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {editorMode === "workflow" ? "Click steps from the left panel to add them. Drag nodes to reposition." : "Add and configure steps using the form below."}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setEditorMode("workflow")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  editorMode === "workflow"
                    ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <IconLayoutGrid size={16} />
                Visual
              </button>
              <button
                onClick={() => setEditorMode("form")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  editorMode === "form"
                    ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <IconList size={16} />
                Form
              </button>
            </div>
          </div>

          {editorMode === "workflow" ? (
            <RunbookFlowEditor
              initialSteps={steps}
              onChange={setSteps}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            />
          ) : (
            <FormBasedEditor
              steps={steps}
              onChange={setSteps}
            />
          )}
        </div>
      </div>
    </div>

    {/* Fullscreen Editor Overlay */}
    {isFullscreen && (
      <div className="fixed inset-0 z-50 bg-slate-900">
        <RunbookFlowEditor
          initialSteps={steps}
          onChange={setSteps}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        />
      </div>
    )}
    </>
  );
}
