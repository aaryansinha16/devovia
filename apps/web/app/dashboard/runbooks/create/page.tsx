"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@repo/ui/components";
import {
  createRunbook,
  type RunbookStep,
} from "../../../../lib/services/runbooks-service";

const stepTypes = [
  {
    value: "HTTP",
    label: "HTTP Request",
    description: "Make an HTTP/REST API call",
  },
  { value: "SQL", label: "SQL Query", description: "Execute a database query" },
  {
    value: "WAIT",
    label: "Wait",
    description: "Pause execution for a duration",
  },
  {
    value: "MANUAL",
    label: "Manual Approval",
    description: "Wait for human approval",
  },
  {
    value: "CONDITIONAL",
    label: "Conditional",
    description: "Branch based on conditions",
  },
  { value: "AI", label: "AI Analysis", description: "Use AI to analyze data" },
  {
    value: "PARALLEL",
    label: "Parallel",
    description: "Run steps in parallel",
  },
];

const defaultStepConfigs: Record<string, object> = {
  HTTP: { method: "GET", url: "", headers: {}, body: null },
  SQL: { query: "", connectionString: "" },
  WAIT: { duration: 5 },
  MANUAL: { approvers: [], instructions: "" },
  CONDITIONAL: { condition: "", onTrue: [], onFalse: [] },
  AI: { prompt: "", model: "gpt-4" },
  PARALLEL: { steps: [], maxConcurrency: 5 },
};

export default function CreateRunbookPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [environment, setEnvironment] = useState<
    "DEVELOPMENT" | "STAGING" | "PRODUCTION"
  >("DEVELOPMENT");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [steps, setSteps] = useState<RunbookStep[]>([]);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  function addStep(type: string) {
    const newStep: RunbookStep = {
      id: `step-${Date.now()}`,
      name: `${type} Step`,
      type: type as RunbookStep["type"],
      config: { ...defaultStepConfigs[type] },
      onFailure: "STOP",
    };
    setSteps([...steps, newStep]);
    setExpandedStep(steps.length);
  }

  function removeStep(index: number) {
    setSteps(steps.filter((_, i) => i !== index));
    if (expandedStep === index) {
      setExpandedStep(null);
    }
  }

  function updateStep(index: number, updates: Partial<RunbookStep>) {
    setSteps(
      steps.map((step, i) => (i === index ? { ...step, ...updates } : step)),
    );
  }

  function moveStep(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= steps.length) return;

    const newSteps = [...steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[newIndex]!;
    newSteps[newIndex] = temp!;
    setSteps(newSteps);
    setExpandedStep(newIndex);
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

      const runbook = await createRunbook({
        name: name.trim(),
        description: description.trim() || undefined,
        environment,
        tags,
        steps,
      });

      router.push(`/dashboard/runbooks/${runbook.id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create runbook";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">Create Runbook</h1>
          <p className="text-gray-400">Define your automation workflow</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Basic Information
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Deploy to Production"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this runbook does..."
              rows={3}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Environment
              </label>
              <select
                value={environment}
                onChange={(e) =>
                  setEnvironment(
                    e.target.value as "DEVELOPMENT" | "STAGING" | "PRODUCTION",
                  )
                }
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white"
              >
                <option value="DEVELOPMENT">Development</option>
                <option value="STAGING">Staging</option>
                <option value="PRODUCTION">Production</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addTag())
                  }
                  placeholder="Add tag..."
                  className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  onClick={addTag}
                  variant="outline"
                  className="border-gray-600"
                >
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-700 text-gray-300 text-sm rounded flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Steps</h2>

        <div className="space-y-3 mb-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
            >
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-800"
                onClick={() =>
                  setExpandedStep(expandedStep === index ? null : index)
                }
              >
                <GripVertical className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-400 w-8">
                  #{index + 1}
                </span>
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded">
                  {step.type}
                </span>
                <input
                  type="text"
                  value={step.name}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateStep(index, { name: e.target.value });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-transparent border-0 text-white focus:ring-0 outline-none"
                  placeholder="Step name..."
                />
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveStep(index, "up");
                    }}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-white"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveStep(index, "down");
                    }}
                    disabled={index === steps.length - 1}
                    className="text-gray-400 hover:text-white"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStep(index);
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {expandedStep === index && (
                <div className="border-t border-gray-700 p-4 space-y-4">
                  {step.type === "HTTP" && (
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Method
                        </label>
                        <select
                          value={(step.config as { method: string }).method}
                          onChange={(e) =>
                            updateStep(index, {
                              config: {
                                ...step.config,
                                method: e.target.value,
                              },
                            })
                          }
                          className="w-full px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-sm text-white"
                        >
                          <option>GET</option>
                          <option>POST</option>
                          <option>PUT</option>
                          <option>DELETE</option>
                          <option>PATCH</option>
                        </select>
                      </div>
                      <div className="col-span-3">
                        <label className="block text-xs text-gray-400 mb-1">
                          URL
                        </label>
                        <input
                          type="text"
                          value={(step.config as { url: string }).url}
                          onChange={(e) =>
                            updateStep(index, {
                              config: { ...step.config, url: e.target.value },
                            })
                          }
                          placeholder="https://api.example.com/endpoint"
                          className="w-full px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-sm text-white"
                        />
                      </div>
                    </div>
                  )}

                  {step.type === "SQL" && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Query
                      </label>
                      <textarea
                        value={(step.config as { query: string }).query}
                        onChange={(e) =>
                          updateStep(index, {
                            config: { ...step.config, query: e.target.value },
                          })
                        }
                        placeholder="SELECT * FROM users WHERE..."
                        rows={3}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white font-mono"
                      />
                    </div>
                  )}

                  {step.type === "WAIT" && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Duration (seconds)
                      </label>
                      <input
                        type="number"
                        value={(step.config as { duration: number }).duration}
                        onChange={(e) =>
                          updateStep(index, {
                            config: {
                              ...step.config,
                              duration: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-32 px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-sm text-white"
                      />
                    </div>
                  )}

                  {step.type === "MANUAL" && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Instructions
                      </label>
                      <textarea
                        value={
                          (step.config as { instructions: string }).instructions
                        }
                        onChange={(e) =>
                          updateStep(index, {
                            config: {
                              ...step.config,
                              instructions: e.target.value,
                            },
                          })
                        }
                        placeholder="Instructions for the approver..."
                        rows={2}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white"
                      />
                    </div>
                  )}

                  {step.type === "AI" && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Prompt
                      </label>
                      <textarea
                        value={(step.config as { prompt: string }).prompt}
                        onChange={(e) =>
                          updateStep(index, {
                            config: { ...step.config, prompt: e.target.value },
                          })
                        }
                        placeholder="Analyze the following data..."
                        rows={3}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      On Failure
                    </label>
                    <select
                      value={step.onFailure}
                      onChange={(e) =>
                        updateStep(index, {
                          onFailure: e.target.value as RunbookStep["onFailure"],
                        })
                      }
                      className="px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-sm text-white"
                    >
                      <option value="STOP">Stop Execution</option>
                      <option value="CONTINUE">Continue</option>
                      <option value="RETRY">Retry</option>
                      <option value="ROLLBACK">Rollback</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-2 border-dashed border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-3">Add a step:</p>
          <div className="flex flex-wrap gap-2">
            {stepTypes.map((type) => (
              <Button
                key={type.value}
                size="sm"
                variant="outline"
                onClick={() => addStep(type.value)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Plus className="w-3 h-3 mr-1" />
                {type.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="border-gray-600 text-gray-300"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? "Creating..." : "Create Runbook"}
        </Button>
      </div>
    </div>
  );
}
