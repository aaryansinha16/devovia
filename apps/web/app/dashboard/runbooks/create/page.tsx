"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { IconArrowLeft, IconLayoutGrid, IconList } from "@tabler/icons-react";
import { type RunbookStep } from "../../../../lib/services/runbooks-service";
import { useCreateRunbook } from "../../../../lib/hooks/useRunbook";
import { useToast } from "@repo/ui/hooks/use-toast";
import { Container, Heading, Text, GlassCard, IconButton, BackgroundDecorative, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button } from "@repo/ui";
import { FansyInput, FansyLabel } from "@repo/ui/components";

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

export default function CreateRunbookPage() {
  const router = useRouter();
  const { mutate: createRunbook, loading: saving } = useCreateRunbook();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [environment, setEnvironment] = useState<"DEVELOPMENT" | "STAGING" | "PRODUCTION">("DEVELOPMENT");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [steps, setSteps] = useState<RunbookStep[]>([]);
  const [editorMode, setEditorMode] = useState<"workflow" | "form">("workflow");
  const [isFullscreen, setIsFullscreen] = useState(false);

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
      toast({ title: "Error", description: "Name is required" });
      return;
    }
    if (steps.length === 0) {
      toast({ title: "Error", description: "At least one step is required" });
      return;
    }
    try {
      const runbook = await createRunbook({
        name: name.trim(),
        description: description.trim() || undefined,
        environment,
        tags,
        steps,
      });
      toast({ title: "Success!", description: "Runbook created successfully" });
      router.push(`/dashboard/runbooks/${runbook.id}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to create runbook" });
    }
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
          />
          <div className="flex-1">
            <Heading size="h1" variant="gradient" spacing="none">Create Runbook</Heading>
            <Text className="mt-1">Build your automation workflow visually</Text>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => router.push("/dashboard/runbooks")}
              variant="secondary"
              size="md"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || !steps.length || saving}
              variant="gradient"
              size="md"
            >
              {saving ? "Creating..." : "Create Runbook"}
            </Button>
          </div>
        </div>
        {/* Error handling now via toast */}
        <GlassCard className="mb-6">
          <Heading size="h2" spacing="default">Basic Information</Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FansyLabel htmlFor="runbook-name">Name *</FansyLabel>
              <FansyInput id="runbook-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Deploy to Production" className="w-full" />
            </div>
            <div>
              <FansyLabel htmlFor="runbook-environment">Environment</FansyLabel>
              <Select value={environment} onValueChange={(value) => setEnvironment(value as typeof environment)}>
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
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what this runbook does..." rows={2} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm" />
            </div>
            <div className="md:col-span-2">
              <FansyLabel htmlFor="runbook-tags">Tags</FansyLabel>
              <div className="flex gap-2">
                <FansyInput id="runbook-tags" type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="Add tag..." className="flex-1" />
                <Button onClick={addTag} type="button" size="default">Add</Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <span key={tag} className="px-3 py-1.5 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 text-sky-700 dark:text-sky-300 text-sm rounded-lg font-medium flex items-center gap-1">
                      {tag}
                      <Button onClick={() => removeTag(tag)} type="button" variant="ghost" size="sm" className="h-auto p-0 hover:text-red-600 dark:hover:text-red-400">×</Button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </GlassCard>
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