"use client";

import React, { useState } from "react";
import { IconX, IconTrash, IconPlayerPlay, IconLoader2 } from "@tabler/icons-react";
import type { RunbookStep } from "../../../lib/services/runbooks-service";

interface StepConfigPanelProps {
  step: RunbookStep;
   
  onUpdate: (updates: Partial<RunbookStep>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function StepConfigPanel({ step, onUpdate, onDelete, onClose }: StepConfigPanelProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Simulate step test
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (step.type === "HTTP") {
        const config = step.config as { url?: string; method?: string };
        if (!config.url) {
          setTestResult({ success: false, message: "URL is required" });
        } else {
          setTestResult({ success: true, message: `${config.method || "GET"} request would be sent to ${config.url}` });
        }
      } else if (step.type === "WAIT") {
        const config = step.config as { duration?: number };
        setTestResult({ success: true, message: `Would wait for ${config.duration || 0} seconds` });
      } else {
        setTestResult({ success: true, message: "Step configuration is valid" });
      }
    } catch (error) {
      setTestResult({ success: false, message: "Test failed" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Configure Step</h3>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <IconX size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Step Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Step Name
          </label>
          <input
            type="text"
            value={step.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Step Type Badge */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Type
          </label>
          <span className="inline-block px-3 py-1.5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-sm font-medium rounded-lg">
            {step.type}
          </span>
        </div>

        {/* Type-specific configuration */}
        {step.type === "HTTP" && (
          <HttpStepConfig
            config={step.config as any}
            onUpdate={(config) => onUpdate({ config: { ...step.config, ...config } })}
          />
        )}

        {step.type === "SQL" && (
          <SqlStepConfig
            config={step.config as any}
            onUpdate={(config) => onUpdate({ config: { ...step.config, ...config } })}
          />
        )}

        {step.type === "WAIT" && (
          <WaitStepConfig
            config={step.config as any}
            onUpdate={(config) => onUpdate({ config: { ...step.config, ...config } })}
          />
        )}

        {step.type === "MANUAL" && (
          <ManualStepConfig
            config={step.config as any}
            onUpdate={(config) => onUpdate({ config: { ...step.config, ...config } })}
          />
        )}

        {step.type === "AI" && (
          <AiStepConfig
            config={step.config as any}
            onUpdate={(config) => onUpdate({ config: { ...step.config, ...config } })}
          />
        )}

        {/* On Failure */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            On Failure
          </label>
          <select
            value={step.onFailure}
            onChange={(e) => onUpdate({ onFailure: e.target.value as RunbookStep["onFailure"] })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="STOP">Stop Execution</option>
            <option value="CONTINUE">Continue</option>
            <option value="RETRY">Retry</option>
            <option value="ROLLBACK">Rollback</option>
          </select>
        </div>

        {/* Test Result */}
        {testResult && (
          <div
            className={`p-3 rounded-lg text-sm ${
              testResult.success
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
            }`}
          >
            {testResult.message}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
        <button
          onClick={handleTest}
          disabled={testing}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {testing ? (
            <>
              <IconLoader2 size={16} className="animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <IconPlayerPlay size={16} />
              Test Step
            </>
          )}
        </button>

        <button
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
        >
          <IconTrash size={16} />
          Delete Step
        </button>
      </div>
    </div>
  );
}

// HTTP Step Configuration
interface HttpConfig {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: string;
}

function HttpStepConfig({
  config,
  onUpdate,
}: {
  config: HttpConfig;
   
  onUpdate: (config: Partial<HttpConfig>) => void;
}) {
  const [headerKey, setHeaderKey] = useState("");
  const [headerValue, setHeaderValue] = useState("");

  const addHeader = () => {
    if (headerKey && headerValue) {
      onUpdate({ headers: { ...config.headers, [headerKey]: headerValue } });
      setHeaderKey("");
      setHeaderValue("");
    }
  };

  const removeHeader = (key: string) => {
    const newHeaders = { ...config.headers };
    delete newHeaders[key];
    onUpdate({ headers: newHeaders });
  };

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Method
        </label>
        <select
          value={config.method || "GET"}
          onChange={(e) => onUpdate({ method: e.target.value })}
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
          value={config.url || ""}
          onChange={(e) => onUpdate({ url: e.target.value })}
          placeholder="https://api.example.com/endpoint"
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Headers
        </label>
        <div className="space-y-2">
          {Object.entries(config.headers || {}).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 text-xs bg-slate-100 dark:bg-slate-700 rounded-lg px-2 py-1.5">
              <span className="font-medium text-slate-700 dark:text-slate-300">{key}:</span>
              <span className="text-slate-600 dark:text-slate-400 flex-1 truncate">{value}</span>
              <button
                onClick={() => removeHeader(key)}
                className="text-red-500 hover:text-red-700"
              >
                <IconX size={14} />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              type="text"
              value={headerKey}
              onChange={(e) => setHeaderKey(e.target.value)}
              placeholder="Key"
              className="flex-1 px-2 py-1.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <input
              type="text"
              value={headerValue}
              onChange={(e) => setHeaderValue(e.target.value)}
              placeholder="Value"
              className="flex-1 px-2 py-1.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              onClick={addHeader}
              className="px-2 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {(config.method === "POST" || config.method === "PUT" || config.method === "PATCH") && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Request Body (JSON)
          </label>
          <textarea
            value={config.body || ""}
            onChange={(e) => onUpdate({ body: e.target.value })}
            placeholder='{"key": "value"}'
            rows={4}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      )}
    </>
  );
}

// SQL Step Configuration
interface SqlConfig {
  query?: string;
  connectionString?: string;
}

function SqlStepConfig({
  config,
  onUpdate,
}: {
  config: SqlConfig;
   
  onUpdate: (config: Partial<SqlConfig>) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Connection String
        </label>
        <input
          type="text"
          value={config.connectionString || ""}
          onChange={(e) => onUpdate({ connectionString: e.target.value })}
          placeholder="postgresql://user:pass@host:5432/db"
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          SQL Query
        </label>
        <textarea
          value={config.query || ""}
          onChange={(e) => onUpdate({ query: e.target.value })}
          placeholder="SELECT * FROM users WHERE id = $1"
          rows={4}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
    </>
  );
}

// Wait Step Configuration
interface WaitConfig {
  duration?: number;
}

function WaitStepConfig({
  config,
  onUpdate,
}: {
  config: WaitConfig;
   
  onUpdate: (config: Partial<WaitConfig>) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        Duration (seconds)
      </label>
      <input
        type="number"
        value={config.duration || 0}
        onChange={(e) => onUpdate({ duration: parseInt(e.target.value) || 0 })}
        min={0}
        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
    </div>
  );
}

// Manual Approval Step Configuration
interface ManualConfig {
  instructions?: string;
  approvers?: string[];
}

function ManualStepConfig({
  config,
  onUpdate,
}: {
  config: ManualConfig;
   
  onUpdate: (config: Partial<ManualConfig>) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Instructions
        </label>
        <textarea
          value={config.instructions || ""}
          onChange={(e) => onUpdate({ instructions: e.target.value })}
          placeholder="Describe what needs to be approved..."
          rows={3}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
    </>
  );
}

// AI Step Configuration
interface AiConfig {
  prompt?: string;
  model?: string;
}

function AiStepConfig({
  config,
  onUpdate,
}: {
  config: AiConfig;
   
  onUpdate: (config: Partial<AiConfig>) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Model
        </label>
        <select
          value={config.model || "gpt-4"}
          onChange={(e) => onUpdate({ model: e.target.value })}
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
          value={config.prompt || ""}
          onChange={(e) => onUpdate({ prompt: e.target.value })}
          placeholder="Analyze the following data and provide insights..."
          rows={4}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
    </>
  );
}
