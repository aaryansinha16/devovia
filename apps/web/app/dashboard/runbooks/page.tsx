"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  IconPlus,
  IconPlayerPlay,
  IconEdit,
  IconTrash,
  IconLoader2,
  IconCalendar,
} from "@tabler/icons-react";
import { type Runbook, deleteRunbook, executeRunbook } from "../../../lib/services/runbooks-service";
import { useRunbooks } from "../../../lib/hooks/useRunbook";
import { useToast } from "@repo/ui/hooks/use-toast";
import { Container, Heading, Text, Input, EmptyState, GlassCard, BackgroundDecorative, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button } from "@repo/ui";
import Loader from "../../../components/ui/loader";

const statusColors: Record<string, string> = {
  DRAFT: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400",
  ACTIVE: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
  ARCHIVED: "bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400",
  DEPRECATED: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
};

const environmentColors: Record<string, string> = {
  DEVELOPMENT: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
  STAGING: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
  PRODUCTION: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
};

export default function RunbooksPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [environmentFilter, setEnvironmentFilter] = useState("all");
  const [executingId, setExecutingId] = useState<string | null>(null);

  const params = useMemo(() => ({
    status: statusFilter !== "all" ? statusFilter : undefined,
    environment: environmentFilter !== "all" ? environmentFilter : undefined,
  }), [statusFilter, environmentFilter]);

  const { data: runbooks = [], loading, error, refetch } = useRunbooks(params);

  async function handleExecute(runbook: Runbook) {
    debugger;
    if (executingId) return;

    try {
      setExecutingId(runbook.id);
      const execution = await executeRunbook(runbook.id, {});
      // toast({
      //   title: "Success!",
      //   description: "Runbook execution started",
      // });
      router.push(`/dashboard/runbooks/executions/${execution.id}`);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to execute runbook",
      });
    } finally {
      setExecutingId(null);
    }
  }

  async function handleDelete(runbook: Runbook) {
    if (!confirm(`Are you sure you want to delete "${runbook.name}"?`)) {
      return;
    }

    try {
      await deleteRunbook(runbook.id);
      toast({
        title: "Success!",
        description: "Runbook deleted successfully",
      });
      refetch();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete runbook",
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 relative overflow-hidden">
      <BackgroundDecorative variant="subtle" />
      <Container className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-10">
          <div>
            <Heading size="h1" variant="gradient" spacing="sm">
              Runbooks
            </Heading>
            <Text>
              Automate your operational workflows
            </Text>
          </div>

          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-slate-900/50 rounded-xl">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
                <SelectItem value="DEPRECATED">Deprecated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={environmentFilter} onValueChange={setEnvironmentFilter}>
              <SelectTrigger className="w-[180px] bg-slate-900/50 rounded-xl">
                <SelectValue placeholder="All Environments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Environments</SelectItem>
                <SelectItem value="DEVELOPMENT">Development</SelectItem>
                <SelectItem value="STAGING">Staging</SelectItem>
                <SelectItem value="PRODUCTION">Production</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => router.push("/dashboard/runbooks/create")}
              variant="gradient"
              size="md"
              leftIcon={<IconPlus size={18} />}
            >
              Create Runbook
            </Button>
          </div>
        </div>

        {loading ? (
          <Loader />
        ) : error ? (
          <div className="p-6 text-center bg-red-50 dark:bg-red-900/20 rounded-2xl shadow-lg shadow-red-200/50 dark:shadow-red-900/50">
            <p className="text-red-600 dark:text-red-400 mb-3">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="text-sm text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 underline font-medium"
            >
              Try Again
            </button>
          </div>
        ) : runbooks.length === 0 ? (
          <EmptyState
            icon="⚡"
            title="No runbooks yet"
            description="Create your first runbook to automate workflows!"
            action={
              <button
                onClick={() => router.push("/dashboard/runbooks/create")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-sky-500/30"
              >
                <IconPlus size={18} />
                Create Runbook
              </button>
            }
          />
        ) : (
          <div className="grid gap-6">
            {runbooks.map((runbook) => (
              <GlassCard
                key={runbook.id}
                className="group p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {runbook.name}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                      {runbook.description || "No description"}
                    </p>

                    <div className="flex items-center gap-3 text-sm flex-wrap">
                      <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400">
                        <IconCalendar size={14} />
                        {new Date(runbook.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400">
                        {runbook.steps?.length || 0} steps
                      </span>
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${statusColors[runbook.status]}`}>
                        {runbook.status}
                      </span>
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${environmentColors[runbook.environment]}`}>
                        {runbook.environment}
                      </span>
                      <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400">
                        v{runbook.version}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleExecute(runbook)}
                      disabled={executingId === runbook.id || runbook.status !== "ACTIVE"}
                      className="p-2.5 text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Execute"
                    >
                      {executingId === runbook.id ? (
                        <IconLoader2 size={18} className="animate-spin" />
                      ) : (
                        <IconPlayerPlay size={18} />
                      )}
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/runbooks/${runbook.id}`)}
                      className="p-2.5 text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-xl transition-all"
                      title="Edit"
                    >
                      <IconEdit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(runbook)}
                      className="p-2.5 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                      title="Delete"
                    >
                      <IconTrash size={18} />
                    </button>
                  </div>
                </div>

                {runbook.tags && runbook.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {runbook.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 text-sky-700 dark:text-sky-300 text-xs rounded-lg font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
