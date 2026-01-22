"use client";

import React, { useState } from "react";
import {
  IconPlus,
  IconTrash,
  IconChevronDown,
  IconChevronUp,
  IconGripVertical,
} from "@tabler/icons-react";
import type { RunbookStep } from "../../../lib/services/runbooks-service";

interface FormBasedEditorProps {
  steps: RunbookStep[];
  // eslint-disable-next-line no-unused-vars
  onChange: (steps: RunbookStep[]) => void;
}

export function FormBasedEditor({ steps, onChange }: FormBasedEditorProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const addStep = (type: RunbookStep["type"]) => {
    const newStep: RunbookStep = {
      id: `step-${Date.now()}`,
      name: `${type} Step`,
      type,
      config: getDefaultConfig(type),
      retryConfig: { maxAttempts: 0, delayMs: 0 },
    };
    onChange([...steps, newStep]);
    setExpandedStep(newStep.id);
  };

  const updateStep = (index: number, updates: Partial<RunbookStep>) => {
    const newSteps = [...steps];
    const currentStep = newSteps[index];
    if (currentStep) {
      newSteps[index] = { ...currentStep, ...updates };
      onChange(newSteps);
    }
  };

  const deleteStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    onChange(newSteps);
    setExpandedStep(null);
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === steps.length - 1)
    ) {
      return;
    }

    const newSteps = [...steps];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const temp = newSteps[index];
    const target = newSteps[targetIndex];
    if (temp && target) {
      newSteps[index] = target;
      newSteps[targetIndex] = temp;
      onChange(newSteps);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Step Buttons */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
          Add Step
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {stepTypes.map((stepType) => (
            <button
              key={stepType.type}
              onClick={() => addStep(stepType.type)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors"
            >
              <IconPlus size={16} />
              {stepType.label}
            </button>
          ))}
        </div>
      </div>

      {/* Steps List */}
      {steps.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            No steps yet. Click a button above to add your first step.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              {/* Step Header */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveStep(index, "up")}
                    disabled={index === 0}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <IconChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => moveStep(index, "down")}
                    disabled={index === steps.length - 1}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <IconChevronDown size={14} />
                  </button>
                </div>

                <IconGripVertical size={20} className="text-slate-400" />

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Step {index + 1}
                    </span>
                    <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-xs font-medium rounded">
                      {step.type}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={step.name}
                    onChange={(e) => updateStep(index, { name: e.target.value })}
                    className="mt-1 w-full bg-transparent text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none"
                    placeholder="Step name..."
                  />
                </div>

                <button
                  onClick={() =>
                    setExpandedStep(expandedStep === step.id ? null : step.id)
                  }
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  {expandedStep === step.id ? (
                    <IconChevronUp size={18} />
                  ) : (
                    <IconChevronDown size={18} />
                  )}
                </button>

                <button
                  onClick={() => deleteStep(index)}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                >
                  <IconTrash size={18} />
                </button>
              </div>

              {/* Step Configuration (Expanded) */}
              {expandedStep === step.id && (
                <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-700">
                  <StepConfigForm
                    step={step}
                    onChange={(updates) => updateStep(index, updates)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Step Configuration Form Component
function StepConfigForm({
  step,
  onChange,
}: {
  step: RunbookStep;
  // eslint-disable-next-line no-unused-vars
  onChange: (updates: Partial<RunbookStep>) => void;
}) {
  const updateConfig = (configUpdates: Record<string, unknown>) => {
    onChange({
      config: { ...step.config, ...configUpdates },
    });
  };

  return (
    <div className="space-y-4">
      {/* Type-specific configuration */}
      {step.type === "HTTP" && (
        <HttpConfigForm config={step.config} onChange={updateConfig} />
      )}
      {step.type === "SQL" && (
        <SqlConfigForm config={step.config} onChange={updateConfig} />
      )}
      {step.type === "WAIT" && (
        <WaitConfigForm config={step.config} onChange={updateConfig} />
      )}
      {step.type === "MANUAL" && (
        <ManualConfigForm config={step.config} onChange={updateConfig} />
      )}
      {step.type === "AI" && (
        <AiConfigForm config={step.config} onChange={updateConfig} />
      )}

      {/* Common settings */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          Advanced Settings
        </h4>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <select
              value={step.onFailure || "STOP"}
              onChange={(e) => onChange({ onFailure: e.target.value as "STOP" | "CONTINUE" | "ROLLBACK" | "RETRY" })}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="STOP">Stop on failure</option>
              <option value="CONTINUE">Continue on failure</option>
              <option value="ROLLBACK">Rollback on failure</option>
              <option value="RETRY">Retry on failure</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}

// HTTP Configuration
function HttpConfigForm({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  // eslint-disable-next-line no-unused-vars
  onChange: (updates: Record<string, unknown>) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Method
        </label>
        <select
          value={(config.method as string) || "GET"}
          onChange={(e) => onChange({ method: e.target.value })}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          URL
        </label>
        <input
          type="text"
          value={(config.url as string) || ""}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder="https://api.example.com/endpoint"
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
      {(config.method === "POST" || config.method === "PUT" || config.method === "PATCH") && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Request Body (JSON)
          </label>
          <textarea
            value={(config.body as string) || ""}
            onChange={(e) => onChange({ body: e.target.value })}
            placeholder='{"key": "value"}'
            rows={4}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      )}
    </>
  );
}

// SQL Configuration
function SqlConfigForm({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  // eslint-disable-next-line no-unused-vars
  onChange: (updates: Record<string, unknown>) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Connection String
        </label>
        <input
          type="text"
          value={(config.connectionString as string) || ""}
          onChange={(e) => onChange({ connectionString: e.target.value })}
          placeholder="postgresql://user:pass@host:5432/db"
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          SQL Query
        </label>
        <textarea
          value={(config.query as string) || ""}
          onChange={(e) => onChange({ query: e.target.value })}
          placeholder="SELECT * FROM users WHERE id = $1"
          rows={4}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
    </>
  );
}

// Wait Configuration
function WaitConfigForm({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  // eslint-disable-next-line no-unused-vars
  onChange: (updates: Record<string, unknown>) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        Duration (seconds)
      </label>
      <input
        type="number"
        value={(config.duration as number) || 0}
        onChange={(e) => onChange({ duration: parseInt(e.target.value) || 0 })}
        min={0}
        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
    </div>
  );
}

// Manual Approval Configuration
function ManualConfigForm({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  // eslint-disable-next-line no-unused-vars
  onChange: (updates: Record<string, unknown>) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        Instructions
      </label>
      <textarea
        value={(config.instructions as string) || ""}
        onChange={(e) => onChange({ instructions: e.target.value })}
        placeholder="Describe what needs to be approved..."
        rows={3}
        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
    </div>
  );
}

// AI Configuration
function AiConfigForm({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  // eslint-disable-next-line no-unused-vars
  onChange: (updates: Record<string, unknown>) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Model
        </label>
        <select
          value={(config.model as string) || "gpt-4"}
          onChange={(e) => onChange({ model: e.target.value })}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          <option value="claude-3-opus">Claude 3 Opus</option>
          <option value="claude-3-sonnet">Claude 3 Sonnet</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Prompt
        </label>
        <textarea
          value={(config.prompt as string) || ""}
          onChange={(e) => onChange({ prompt: e.target.value })}
          placeholder="Enter your AI prompt..."
          rows={4}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
    </>
  );
}

// Step types for the add buttons
const stepTypes = [
  { type: "HTTP" as const, label: "HTTP" },
  { type: "SQL" as const, label: "SQL" },
  { type: "WAIT" as const, label: "Wait" },
  { type: "MANUAL" as const, label: "Manual" },
  { type: "CONDITIONAL" as const, label: "Conditional" },
  { type: "AI" as const, label: "AI" },
  { type: "PARALLEL" as const, label: "Parallel" },
];

function getDefaultConfig(type: string): Record<string, unknown> {
  switch (type) {
    case "HTTP":
      return { method: "GET", url: "", headers: {}, body: null, expectedStatusCodes: [200] };
    case "SQL":
      return { query: "", connectionString: "" };
    case "WAIT":
      return { duration: 5 };
    case "MANUAL":
      return { approvers: [], instructions: "" };
    case "CONDITIONAL":
      return { condition: "", onTrue: [], onFalse: [] };
    case "AI":
      return { prompt: "", model: "gpt-4" };
    case "PARALLEL":
      return { steps: [], maxConcurrency: 5 };
    default:
      return {};
  }
}
