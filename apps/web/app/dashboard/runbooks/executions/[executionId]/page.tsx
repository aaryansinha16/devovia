"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { IconArrowLeft, IconSquare, IconLoader2, IconCopy, IconCheck } from "@tabler/icons-react";
import {
  getExecution,
  cancelExecution,
  type RunbookExecution,
  type RunbookLog,
} from "../../../../../lib/services/runbooks-service";
import { API_URL } from "../../../../../lib/api-config";

const statusColors: Record<string, string> = {
  QUEUED: "bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400",
  RUNNING: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
  PAUSED: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400",
  SUCCESS: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
  FAILED: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
  CANCELLED: "bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400",
  TIMEOUT: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
};

const logLevelColors: Record<string, string> = {
  DEBUG: "text-slate-500 dark:text-slate-400",
  INFO: "text-blue-600 dark:text-blue-400",
  WARN: "text-yellow-600 dark:text-yellow-400",
  ERROR: "text-red-600 dark:text-red-400",
};

export default function ExecutionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const executionId = params.executionId as string;

  const [execution, setExecution] = useState<RunbookExecution | null>(null);
  const [logs, setLogs] = useState<RunbookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    loadExecution();
    connectToLogStream();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [executionId]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  async function loadExecution() {
    try {
      setLoading(true);
      const data = await getExecution(executionId);
      setExecution(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load execution";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function connectToLogStream() {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : "";
    const url = `${API_URL}/runbooks/executions/${executionId}/logs/stream?token=${encodeURIComponent(token || "")}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const log = JSON.parse(event.data);
        setLogs((prev) => [...prev, log]);
      } catch (e) {
        console.error("Failed to parse log:", e);
      }
    };

    eventSource.addEventListener("status", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        setExecution((prev) => (prev ? { ...prev, ...data } : prev));
      } catch (e) {
        console.error("Failed to parse status:", e);
      }
    });

    eventSource.addEventListener("complete", () => {
      eventSource.close();
      loadExecution();
    });

    eventSource.onerror = () => {
      eventSource.close();
    };

    eventSourceRef.current = eventSource;
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel this execution?")) {
      return;
    }

    try {
      setCancelling(true);
      await cancelExecution(executionId);
      await loadExecution();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to cancel execution";
      setError(message);
    } finally {
      setCancelling(false);
    }
  }

  async function copyToClipboard(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  function formatDuration(start?: string, end?: string): string {
    if (!start) return "-";
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);

    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 flex items-center justify-center">
        <IconLoader2 className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  if (error || !execution) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="p-6 text-center bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-500">
            <p className="text-red-600 dark:text-red-400 mb-3">{error || "Execution not found"}</p>
            <button
              onClick={() => router.back()}
              className="text-sm text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 underline font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isRunning = execution.status === "RUNNING" || execution.status === "QUEUED";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-sky-500/20 dark:bg-sky-400/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/20 dark:bg-purple-400/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            aria-label="Go back"
          >
            <IconArrowLeft size={20} className="text-slate-700 dark:text-slate-300" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-sky-600 dark:from-slate-100 dark:to-sky-400 bg-clip-text text-transparent">
                {execution.runbook?.name || "Execution"}
              </h1>
              <span className={`px-3 py-1.5 text-sm font-medium rounded-lg ${statusColors[execution.status]}`}>
                {execution.status}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Execution ID: <span className="font-mono">{execution.id.slice(0, 8)}...{execution.id.slice(-4)}</span>
              </p>
              <button
                onClick={() => copyToClipboard(execution.id, "execution")}
                className="p-1 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 rounded transition-colors"
                title="Copy full ID"
              >
                {copiedId === "execution" ? <IconCheck size={14} className="text-green-500" /> : <IconCopy size={14} />}
              </button>
            </div>
          </div>
          {isRunning && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <IconSquare size={16} />
              {cancelling ? "Cancelling..." : "Cancel"}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400">Trigger Type</p>
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 capitalize">{execution.triggerType}</p>
          </div>
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400">Triggered By</p>
            <div className="flex items-center gap-2">
              {execution.triggeredByName ? (
                <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {execution.triggeredByName}
                </p>
              ) : (
                <>
                  <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 font-mono">
                    {execution.triggeredBy.slice(0, 4)}...
                  </p>
                  <button
                    onClick={() => copyToClipboard(execution.triggeredBy, "triggeredBy")}
                    className="p-1.5 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 rounded transition-colors"
                    title="Copy full ID"
                  >
                    {copiedId === "triggeredBy" ? <IconCheck size={16} className="text-green-500" /> : <IconCopy size={16} />}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400">Duration</p>
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {formatDuration(execution.startedAt, execution.finishedAt)}
            </p>
          </div>
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400">Progress</p>
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {execution.currentStep || 0} / {execution.totalSteps || 0} steps
            </p>
          </div>
        </div>

        {execution.totalSteps && execution.totalSteps > 0 && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Progress</span>
              <span className="text-sm text-slate-800 dark:text-slate-100 font-medium">
                {Math.round(((execution.currentStep || 0) / execution.totalSteps) * 100)}%
              </span>
            </div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  execution.status === "FAILED" ? "bg-red-500" : "bg-gradient-to-r from-sky-500 to-indigo-600"
                }`}
                style={{
                  width: `${((execution.currentStep || 0) / execution.totalSteps) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Execution Logs</h2>
            {isRunning && (
              <span className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                Live
              </span>
            )}
          </div>
          <div className="h-96 overflow-y-auto p-6 font-mono text-sm bg-slate-50 dark:bg-slate-900/50">
            {logs.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400">
                {isRunning ? "Waiting for logs..." : "No logs available"}
              </p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="flex gap-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded px-2 -mx-2">
                  <span className="text-slate-500 dark:text-slate-400 w-20 flex-shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`w-12 flex-shrink-0 font-medium ${logLevelColors[log.level]}`}>
                    [{log.level}]
                  </span>
                  {log.stepIndex !== undefined && (
                    <span className="text-slate-500 dark:text-slate-400 w-16 flex-shrink-0">Step {log.stepIndex + 1}</span>
                  )}
                  <span className="text-slate-700 dark:text-slate-300">{log.message}</span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
