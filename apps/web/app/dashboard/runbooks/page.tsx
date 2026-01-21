"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  Play,
  Trash2,
  Edit,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@repo/ui/components";
import {
  listRunbooks,
  deleteRunbook,
  executeRunbook,
  type Runbook,
} from "../../../lib/services/runbooks-service";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500",
  ACTIVE: "bg-green-500",
  ARCHIVED: "bg-yellow-500",
  DEPRECATED: "bg-red-500",
};

const environmentColors: Record<string, string> = {
  DEVELOPMENT: "bg-blue-500",
  STAGING: "bg-orange-500",
  PRODUCTION: "bg-red-500",
};

export default function RunbooksPage() {
  const router = useRouter();
  const [runbooks, setRunbooks] = useState<Runbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [environmentFilter, setEnvironmentFilter] = useState<string>("");
  const [executing, setExecuting] = useState<string | null>(null);

  useEffect(() => {
    loadRunbooks();
  }, [statusFilter, environmentFilter]);

  async function loadRunbooks() {
    try {
      setLoading(true);
      setError(null);
      const data = await listRunbooks({
        status: statusFilter || undefined,
        environment: environmentFilter || undefined,
        search: searchQuery || undefined,
      });
      setRunbooks(data);
    } catch (err: any) {
      setError(err.message || "Failed to load runbooks");
    } finally {
      setLoading(false);
    }
  }

  async function handleExecute(runbook: Runbook) {
    if (executing) return;

    try {
      setExecuting(runbook.id);
      const execution = await executeRunbook(runbook.id);
      router.push(`/dashboard/runbooks/executions/${execution.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to execute runbook");
    } finally {
      setExecuting(null);
    }
  }

  async function handleDelete(runbook: Runbook) {
    if (!confirm(`Are you sure you want to delete "${runbook.name}"?`)) {
      return;
    }

    try {
      await deleteRunbook(runbook.id);
      setRunbooks(runbooks.filter((r) => r.id !== runbook.id));
    } catch (err: any) {
      setError(err.message || "Failed to delete runbook");
    }
  }

  const filteredRunbooks = runbooks.filter(
    (runbook) =>
      runbook.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      runbook.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Runbooks</h1>
          <p className="text-gray-400 mt-1">
            Automate your operational workflows with runbooks
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/runbooks/create")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Runbook
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search runbooks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
          <option value="DEPRECATED">Deprecated</option>
        </select>
        <select
          value={environmentFilter}
          onChange={(e) => setEnvironmentFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
        >
          <option value="">All Environments</option>
          <option value="DEVELOPMENT">Development</option>
          <option value="STAGING">Staging</option>
          <option value="PRODUCTION">Production</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredRunbooks.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
            <Filter className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            No runbooks found
          </h3>
          <p className="text-gray-400 mb-4">
            {searchQuery || statusFilter || environmentFilter
              ? "Try adjusting your filters"
              : "Create your first runbook to get started"}
          </p>
          {!searchQuery && !statusFilter && !environmentFilter && (
            <Button
              onClick={() => router.push("/dashboard/runbooks/create")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Runbook
            </Button>
          )}
        </div>
      )}

      {/* Runbooks Grid */}
      {!loading && filteredRunbooks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRunbooks.map((runbook) => (
            <div
              key={runbook.id}
              className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {runbook.name}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                    {runbook.description || "No description"}
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${statusColors[runbook.status]} text-white`}
                >
                  {runbook.status}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${environmentColors[runbook.environment]} text-white`}
                >
                  {runbook.environment}
                </span>
                <span className="px-2 py-1 text-xs font-medium rounded bg-gray-700 text-gray-300">
                  v{runbook.version}
                </span>
              </div>

              {/* Steps Count */}
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                <span>{runbook.steps?.length || 0} steps</span>
                {runbook.tags?.length > 0 && (
                  <span>{runbook.tags.length} tags</span>
                )}
              </div>

              {/* Owner */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white">
                  {runbook.owner?.name?.charAt(0) || "?"}
                </div>
                <span className="text-sm text-gray-400">
                  {runbook.owner?.name || "Unknown"}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-gray-700">
                <Button
                  size="sm"
                  onClick={() => handleExecute(runbook)}
                  disabled={
                    executing === runbook.id || runbook.status !== "ACTIVE"
                  }
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {executing === runbook.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-1" />
                      Run
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    router.push(`/dashboard/runbooks/${runbook.id}`)
                  }
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(runbook)}
                  className="border-gray-600 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
