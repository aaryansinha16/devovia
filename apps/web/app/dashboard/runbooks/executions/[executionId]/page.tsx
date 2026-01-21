"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Square,
  Check,
  X,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@repo/ui/components";
import {
  getExecution,
  cancelExecution,
  type RunbookExecution,
  type RunbookLog,
} from "../../../../../lib/services/runbooks-service";
import { API_URL } from "../../../../../lib/api-config";

const statusIcons: Record<string, React.ReactNode> = {
  QUEUED: <Clock className="w-5 h-5 text-gray-400" />,
  RUNNING: <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />,
  PAUSED: <Clock className="w-5 h-5 text-yellow-400" />,
  SUCCESS: <Check className="w-5 h-5 text-green-400" />,
  FAILED: <X className="w-5 h-5 text-red-400" />,
  CANCELLED: <X className="w-5 h-5 text-gray-400" />,
  TIMEOUT: <AlertCircle className="w-5 h-5 text-orange-400" />,
};

const statusColors: Record<string, string> = {
  QUEUED: "bg-gray-500",
  RUNNING: "bg-blue-500",
  PAUSED: "bg-yellow-500",
  SUCCESS: "bg-green-500",
  FAILED: "bg-red-500",
  CANCELLED: "bg-gray-500",
  TIMEOUT: "bg-orange-500",
};

const logLevelColors: Record<string, string> = {
  DEBUG: "text-gray-400",
  INFO: "text-blue-400",
  WARN: "text-yellow-400",
  ERROR: "text-red-400",
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
      const message =
        err instanceof Error ? err.message : "Failed to load execution";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function connectToLogStream() {
    const url = `${API_URL}/runbooks/executions/${executionId}/logs/stream`;
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
      const message =
        err instanceof Error ? err.message : "Failed to cancel execution";
      setError(message);
    } finally {
      setCancelling(false);
    }
  }

  function formatDuration(start?: string, end?: string): string {
    if (!start) return "-";
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);

    if (duration < 60) return `${duration}s`;
    if (duration < 3600)
      return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !execution) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
          {error || "Execution not found"}
        </div>
        <Button
          onClick={() => router.back()}
          className="mt-4"
          variant="outline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const isRunning =
    execution.status === "RUNNING" || execution.status === "QUEUED";

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">
              {execution.runbook?.name || "Execution"}
            </h1>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[execution.status]} text-white flex items-center gap-2`}
            >
              {statusIcons[execution.status]}
              {execution.status}
            </span>
          </div>
          <p className="text-gray-400 mt-1">Execution ID: {execution.id}</p>
        </div>
        {isRunning && (
          <Button
            onClick={handleCancel}
            disabled={cancelling}
            className="bg-red-600 hover:bg-red-700"
          >
            <Square className="w-4 h-4 mr-2" />
            {cancelling ? "Cancelling..." : "Cancel"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400">Trigger Type</p>
          <p className="text-lg font-semibold text-white capitalize">
            {execution.triggerType}
          </p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400">Triggered By</p>
          <p className="text-lg font-semibold text-white">
            {execution.triggeredByName || execution.triggeredBy}
          </p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400">Duration</p>
          <p className="text-lg font-semibold text-white">
            {formatDuration(execution.startedAt, execution.finishedAt)}
          </p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400">Progress</p>
          <p className="text-lg font-semibold text-white">
            {execution.currentStep || 0} / {execution.totalSteps || 0} steps
          </p>
        </div>
      </div>

      {execution.totalSteps && execution.totalSteps > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Progress</span>
            <span className="text-sm text-white">
              {Math.round(
                ((execution.currentStep || 0) / execution.totalSteps) * 100,
              )}
              %
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                execution.status === "FAILED" ? "bg-red-500" : "bg-blue-500"
              }`}
              style={{
                width: `${((execution.currentStep || 0) / execution.totalSteps) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Execution Logs</h2>
          {isRunning && (
            <span className="flex items-center gap-2 text-sm text-blue-400">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
              Live
            </span>
          )}
        </div>
        <div className="h-96 overflow-y-auto p-4 font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500">
              {isRunning ? "Waiting for logs..." : "No logs available"}
            </p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="flex gap-3 py-1 hover:bg-gray-800/50">
                <span className="text-gray-500 w-20 flex-shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={`w-12 flex-shrink-0 font-medium ${logLevelColors[log.level]}`}
                >
                  [{log.level}]
                </span>
                {log.stepIndex !== undefined && (
                  <span className="text-gray-500 w-16 flex-shrink-0">
                    Step {log.stepIndex + 1}
                  </span>
                )}
                <span className="text-gray-300">{log.message}</span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
