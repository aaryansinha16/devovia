"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  IconArrowLeft, 
  IconPlayerPlay, 
  IconLayoutGrid, 
  IconList,
  IconLoader2,
} from "@tabler/icons-react";
import Loader from '../../../../components/ui/loader';
import {
  getRunbook,
  updateRunbook,
  executeRunbook,
  type RunbookStep,
} from "../../../../lib/services/runbooks-service";
import { Container, Heading, Text, GlassCard, IconButton, Input, BackgroundDecorative, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button } from "@repo/ui";

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
    return <Loader />;
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 relative overflow-hidden">
      <BackgroundDecorative variant="subtle" />

      <Container className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <IconButton
            onClick={() => router.back()}
            icon={<IconArrowLeft size={20} className="text-slate-700 dark:text-slate-300" />}
            aria-label="Go back"
          />
          <div className="flex-1">
            <Heading size="h1" variant="gradient" spacing="none">
              Edit Runbook
            </Heading>
            <Text className="mt-1">Update your automation workflow</Text>
          </div>
          <div className="flex items-center gap-3">
            {status === "ACTIVE" && (
              <Button
                onClick={handleExecute}
                disabled={executing || status !== "ACTIVE"}
                variant="gradient"
                size="md"
                leftIcon={executing ? <IconLoader2 size={18} className="animate-spin" /> : <IconPlayerPlay size={18} />}
                className="from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/30 hover:shadow-green-500/40"
              >
                {executing ? "Executing..." : "Execute"}
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="gradient"
              size="md"
              className="from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 shadow-sky-500/30 hover:shadow-sky-500/40"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 rounded-xl shadow-lg shadow-red-200/50 dark:shadow-red-900/50">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Basic Info Section */}
        <GlassCard className="mb-6">
          <Heading size="h2" spacing="default">Basic Information</Heading>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Name *</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Deploy to Production"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</label>
              <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                  <SelectItem value="DEPRECATED">Deprecated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Environment</label>
              <Select value={environment} onValueChange={(value) => setEnvironment(value as "DEVELOPMENT" | "STAGING" | "PRODUCTION")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEVELOPMENT">Development</SelectItem>
                  <SelectItem value="STAGING">Staging</SelectItem>
                  <SelectItem value="PRODUCTION">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this runbook does..."
                rows={2}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tags</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Add tag..."
                  className="flex-1"
                />
                <Button
                  onClick={addTag}
                  variant="secondary"
                  size="sm"
                  className="px-4 py-2"
                >
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <span key={tag} className="px-3 py-1.5 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 text-sky-700 dark:text-sky-300 text-sm rounded-lg font-medium flex items-center gap-1">
                      {tag}
                      <Button onClick={() => removeTag(tag)} variant="ghost" size="sm" className="h-auto p-0 hover:text-red-600 dark:hover:text-red-400">×</Button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Visual Editor Section */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <Heading size="h2" spacing="none">Workflow Editor</Heading>
              <Text size="sm" variant="muted" className="mt-1">
                {editorMode === "workflow" ? "Click steps from the left panel to add them. Drag nodes to reposition." : "Add and configure steps using the form below."}
              </Text>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <Button
                onClick={() => setEditorMode(editorMode === "workflow" ? "form" : "workflow")}
                variant="secondary"
                size="sm"
                leftIcon={editorMode === "workflow" ? <IconList size={18} /> : <IconLayoutGrid size={18} />}
              >
                Switch to {editorMode === "workflow" ? "Form" : "Workflow"} View
              </Button>
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
        </GlassCard>
      </Container>
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
