'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import debounce from 'lodash.debounce';
import { API_URL } from '../../lib/api-config';
import { getTokens } from '../../lib/auth';

// ─── Types ──────────────────────────────────────────────────────────────────

interface CommandSuggestion {
  label: string;
  template: string;
  intent: string;
  icon: string;
}

export interface MemoryItem {
  id: string;
  category: string;
  key: string;
  value: string;
  source: string;
  usageCount: number;
  createdAt: string;
}

export interface MacroItem {
  id: string;
  name: string;
  description: string | null;
  steps: { intent: string; slots: Record<string, any>; description: string }[];
  trigger: string | null;
  runCount: number;
  lastRunAt: string | null;
  createdAt: string;
}

export interface ProactiveSuggestion {
  label: string;
  template: string;
  reason: string;
  icon: string;
}

interface ParsedCommand {
  commandId: string;
  intent: string;
  confidence: number;
  slots: Record<string, any>;
  description: string;
  requiresConfirmation: boolean;
  isChained?: boolean;
  chainSteps?: number;
}

interface ExecutionResult {
  commandId: string;
  success: boolean;
  message: string;
  data?: any;
  redirectUrl?: string;
  canUndo?: boolean;
}

interface HistoryItem {
  id: string;
  rawInput: string;
  intent: string;
  status: string;
  result?: any;
  errorMessage?: string;
  createdAt: string;
  executedAt?: string;
}

type PanelStep = 'idle' | 'loading' | 'confirm' | 'executing' | 'result';

interface TokenUsage {
  totalTokens: number;
  totalCommands: number;
  todayTokens: number;
  todayCommands: number;
}

interface SuperchargedContextType {
  isOpen: boolean;
  isActivating: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;

  // Input state
  input: string;
  setInput: (v: string) => void;

  // Flow state
  step: PanelStep;
  parsedCommand: ParsedCommand | null;
  executionResult: ExecutionResult | null;
  error: string | null;

  // Actions
  submitInput: () => Promise<void>;
  confirmCommand: () => Promise<void>;
  cancelCommand: () => Promise<void>;
  undoLastCommand: () => Promise<void>;
  reset: () => void;

  // Suggestions
  suggestions: CommandSuggestion[];
  loadSuggestions: (query: string) => Promise<void>;

  // History
  history: HistoryItem[];
  loadHistory: () => Promise<void>;
  showHistory: boolean;
  setShowHistory: (v: boolean) => void;

  // Token usage
  tokenUsage: TokenUsage | null;
  loadTokenUsage: () => Promise<void>;

  // Memories & Macros management
  memories: MemoryItem[];
  macros: MacroItem[];
  loadMemories: () => Promise<void>;
  loadMacros: () => Promise<void>;
  deleteMemoryItem: (id: string) => Promise<void>;
  deleteMacroItem: (id: string) => Promise<void>;
  showManage: 'memories' | 'macros' | null;
  setShowManage: (v: 'memories' | 'macros' | null) => void;

  // Streaming
  streamingText: string;
  isStreaming: boolean;

  // Proactive suggestions
  proactiveSuggestions: ProactiveSuggestion[];

  // Contextual quick actions (page-aware)
  contextualActions: CommandSuggestion[];
  currentPage: string;
}

const SuperchargedContext = createContext<SuperchargedContextType | null>(null);

export function useSupercharged() {
  const ctx = useContext(SuperchargedContext);
  if (!ctx) throw new Error('useSupercharged must be used within SuperchargedProvider');
  return ctx;
}

// ─── Provider ───────────────────────────────────────────────────────────────

export function SuperchargedProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const activatingTimer = useRef<NodeJS.Timeout | null>(null);
  const [input, setInput] = useState('');
  const [step, setStep] = useState<PanelStep>('idle');
  const [parsedCommand, setParsedCommand] = useState<ParsedCommand | null>(null);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<CommandSuggestion[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);

  // Memories & Macros
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [macros, setMacros] = useState<MacroItem[]>([]);
  const [showManage, setShowManage] = useState<'memories' | 'macros' | null>(null);

  // Streaming
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  // Proactive suggestions
  const [proactiveSuggestions, setProactiveSuggestions] = useState<ProactiveSuggestion[]>([]);

  // Contextual quick actions
  const pathname = usePathname();
  const [contextualActions, setContextualActions] = useState<CommandSuggestion[]>([]);

  // ── API helpers ─────────────────────────────────────────────────────────

  const apiFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    const tokens = await getTokens();
    if (!tokens?.accessToken) throw new Error('Not authenticated');
    const res = await fetch(`${API_URL}/supercharged${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.accessToken}`,
        ...options.headers,
      },
    });
    return res.json();
  }, []);

  // ── Open / Close ────────────────────────────────────────────────────────

  const open = useCallback(() => {
    // Start the trigger animation first
    setIsActivating(true);
    // Open the modal after trigger spin animation completes
    activatingTimer.current = setTimeout(() => {
      setIsActivating(false);
      setIsOpen(true);
      setShowHistory(false);
    }, 1200);
  }, []);

  const close = useCallback(() => {
    // Cancel any pending activation
    if (activatingTimer.current) {
      clearTimeout(activatingTimer.current);
      activatingTimer.current = null;
    }
    setIsActivating(false);
    setIsOpen(false);
    // Don't reset state immediately — let animation finish
    setTimeout(() => {
      setInput('');
      setStep('idle');
      setParsedCommand(null);
      setExecutionResult(null);
      setError(null);
      setSuggestions([]);
      setShowHistory(false);
      setConversationHistory([]);
    }, 300);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen || isActivating) close();
    else open();
  }, [isOpen, isActivating, open, close]);

  const reset = useCallback(() => {
    setInput('');
    setStep('idle');
    setParsedCommand(null);
    setExecutionResult(null);
    setError(null);
  }, []);

  // ── Token usage (declared early so submitInput/doExecute can reference it) ──

  const loadTokenUsage = useCallback(async () => {
    try {
      const data = await apiFetch('/token-usage');
      if (data.success) {
        setTokenUsage(data.data as TokenUsage);
      }
    } catch {
      // Silently fail
    }
  }, [apiFetch]);

  // ── Submit input → parse ────────────────────────────────────────────────

  const submitInput = useCallback(async () => {
    if (!input.trim()) return;
    setStep('loading');
    setError(null);
    setParsedCommand(null);
    setExecutionResult(null);

    const currentInput = input.trim();

    try {
      const data = await apiFetch('/parse', {
        method: 'POST',
        body: JSON.stringify({ input: currentInput, conversationHistory }),
      });

      if (!data.success) {
        setError(data.message || 'Failed to parse command');
        setStep('idle');
        return;
      }

      const parsed = data.data;
      setParsedCommand(parsed as ParsedCommand);

      // Handle auto-executed intents (Navigate, Conversational)
      if (parsed.autoExecuted && parsed.result) {
        const result = parsed.result as ExecutionResult;
        setExecutionResult({ ...result, commandId: parsed.commandId });
        setStep('result');

        // Stream conversational responses word-by-word for premium feel
        if (parsed.intent === 'Conversational' && result.message) {
          await streamConversational(result.message);
        }

        // Refresh token usage after command execution
        loadTokenUsage();

        // Accumulate conversation turns for multi-turn memory
        setConversationHistory(prev => [
          ...prev,
          { role: 'user' as const, content: currentInput },
          { role: 'assistant' as const, content: result.message || parsed.description },
        ]);

        // Auto-navigate if there's a redirect URL
        if (result.redirectUrl) {
          setTimeout(() => {
            router.push(result.redirectUrl!);
            close();
          }, 800);
        }
        return;
      }

      if (parsed.intent === 'Unknown') {
        setError(parsed.description);
        setStep('idle');
        return;
      }

      if (parsed.requiresConfirmation) {
        setStep('confirm');
      } else {
        // Auto-execute if no confirmation needed
        setStep('executing');
        await doExecute(parsed.commandId, currentInput);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setStep('idle');
    }
  }, [input, apiFetch, conversationHistory, loadTokenUsage]);

  // ── Execute ─────────────────────────────────────────────────────────────

  const doExecute = useCallback(async (commandId: string, userInput?: string) => {
    try {
      const data = await apiFetch('/execute', {
        method: 'POST',
        body: JSON.stringify({ commandId }),
      });

      if (!data.success) {
        setError(data.message || 'Execution failed');
        setStep('idle');
        return;
      }

      const result = data.data as ExecutionResult;
      setExecutionResult(result);
      setStep('result');

      // Refresh token usage after command execution
      loadTokenUsage();

      // Accumulate conversation turns for multi-turn memory
      if (userInput) {
        setConversationHistory(prev => [
          ...prev,
          { role: 'user' as const, content: userInput },
          { role: 'assistant' as const, content: result.message || 'Done.' },
        ]);
      }

      // Auto-navigate after a short delay if there's a redirect URL
      if (result.redirectUrl) {
        setTimeout(() => {
          router.push(result.redirectUrl!);
          close();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Execution failed');
      setStep('idle');
    }
  }, [apiFetch, router, close, loadTokenUsage]);

  const confirmCommand = useCallback(async () => {
    if (!parsedCommand) return;
    setStep('executing');
    await doExecute(parsedCommand.commandId, input || parsedCommand.description);
  }, [parsedCommand, doExecute, input]);

  const cancelCommand = useCallback(async () => {
    if (!parsedCommand) {
      reset();
      return;
    }
    try {
      await apiFetch('/cancel', {
        method: 'POST',
        body: JSON.stringify({ commandId: parsedCommand.commandId }),
      });
    } catch {
      // Ignore cancel errors
    }
    reset();
  }, [parsedCommand, apiFetch, reset]);

  const undoLastCommand = useCallback(async () => {
    if (!executionResult?.commandId) return;
    setStep('executing');
    setError(null);

    try {
      const data = await apiFetch('/undo', {
        method: 'POST',
        body: JSON.stringify({ commandId: executionResult.commandId }),
      });

      if (!data.success) {
        setError(data.message || 'Undo failed');
        setStep('result');
        return;
      }

      setExecutionResult({
        commandId: executionResult.commandId,
        success: true,
        message: data.data?.message || 'Action undone successfully.',
        canUndo: false,
      });
      setStep('result');
    } catch (err: any) {
      setError(err.message || 'Undo failed');
      setStep('result');
    }
  }, [executionResult, apiFetch]);

  // ── Suggestions ─────────────────────────────────────────────────────────

  const debouncedFetchSuggestions = useMemo(
    () =>
      debounce(async (query: string, fetchFn: typeof apiFetch) => {
        try {
          const data = await fetchFn(`/suggestions?q=${encodeURIComponent(query)}`);
          if (data.success) {
            setSuggestions(data.data.suggestions || []);
          }
        } catch {
          // Silently fail
        }
      }, 300),
    [],
  );

  // Cancel debounced calls on unmount
  useEffect(() => {
    return () => {
      debouncedFetchSuggestions.cancel();
    };
  }, [debouncedFetchSuggestions]);

  const loadSuggestions = useCallback(
    (query: string) => {
      debouncedFetchSuggestions(query, apiFetch);
      return Promise.resolve();
    },
    [debouncedFetchSuggestions, apiFetch],
  );

  // ── History ─────────────────────────────────────────────────────────────

  const loadHistory = useCallback(async () => {
    try {
      const data = await apiFetch('/history?limit=20');
      if (data.success) {
        setHistory(data.data.commands || []);
      }
    } catch {
      // Silently fail
    }
  }, [apiFetch]);

  // ── Token usage (see early declaration above) ────────────────────────

  // ── Memories & Macros ──────────────────────────────────────────────────

  const loadMemories = useCallback(async () => {
    try {
      const data = await apiFetch('/memories');
      if (data.success) setMemories(data.data.memories || []);
    } catch { /* silently fail */ }
  }, [apiFetch]);

  const loadMacros = useCallback(async () => {
    try {
      const data = await apiFetch('/macros');
      if (data.success) setMacros(data.data.macros || []);
    } catch { /* silently fail */ }
  }, [apiFetch]);

  const deleteMemoryItem = useCallback(async (memoryId: string) => {
    try {
      await apiFetch('/memories', { method: 'DELETE', body: JSON.stringify({ memoryId }) });
      setMemories(prev => prev.filter(m => m.id !== memoryId));
    } catch { /* silently fail */ }
  }, [apiFetch]);

  const deleteMacroItem = useCallback(async (macroId: string) => {
    try {
      await apiFetch('/macros', { method: 'DELETE', body: JSON.stringify({ macroId }) });
      setMacros(prev => prev.filter(m => m.id !== macroId));
    } catch { /* silently fail */ }
  }, [apiFetch]);

  // ── Streaming for Conversational responses ────────────────────────────

  const streamConversational = useCallback(async (text: string) => {
    setIsStreaming(true);
    setStreamingText('');
    // Simulate streaming by revealing the text progressively
    // (Real SSE streaming is handled by the /parse-stream endpoint if available)
    const words = text.split(' ');
    let accumulated = '';
    for (let i = 0; i < words.length; i++) {
      accumulated += (i === 0 ? '' : ' ') + words[i];
      setStreamingText(accumulated);
      await new Promise(r => setTimeout(r, 25 + Math.random() * 20));
    }
    setIsStreaming(false);
  }, []);

  // ── Proactive Suggestions (memory-based) ──────────────────────────────

  const generateProactiveSuggestions = useCallback(async () => {
    try {
      const data = await apiFetch('/memories');
      if (!data.success) return;
      const mems: MemoryItem[] = data.data.memories || [];
      const suggestions: ProactiveSuggestion[] = [];

      // Day-of-week based suggestions
      const dayOfWeek = new Date().getDay();
      const hour = new Date().getHours();

      // Suggest deploy on Fridays
      if (dayOfWeek === 5) {
        suggestions.push({
          label: 'Deploy staging builds?',
          template: 'Deploy all sites to staging',
          reason: "It's Friday — good time for staging deploys",
          icon: 'Rocket',
        });
      }

      // Morning suggestions
      if (hour >= 7 && hour <= 10) {
        const hasMorningMacro = macros.some(m => m.trigger?.toLowerCase().includes('morning'));
        if (hasMorningMacro) {
          const macro = macros.find(m => m.trigger?.toLowerCase().includes('morning'));
          suggestions.push({
            label: `Run "${macro!.name}"?`,
            template: `Run macro ${macro!.name}`,
            reason: 'Your morning routine macro',
            icon: 'Zap',
          });
        }
      }

      // Preferred language suggestion
      const langPref = mems.find(m => m.key === 'preferred_language');
      if (langPref) {
        suggestions.push({
          label: `Start a ${langPref.value} session`,
          template: `Open a ${langPref.value} session`,
          reason: `Based on your preference for ${langPref.value}`,
          icon: 'Monitor',
        });
      }

      // Frequent intent suggestions
      const freqIntents = mems.filter(m => m.key.startsWith('freq_intent_'));
      const topIntent = freqIntents.sort((a, b) => b.usageCount - a.usageCount)[0];
      if (topIntent && topIntent.usageCount >= 3) {
        const intentName = topIntent.value;
        if (intentName === 'CreateProject') {
          suggestions.push({
            label: 'Create a new project',
            template: 'Create a project called ',
            reason: `You frequently create projects (${topIntent.usageCount} times)`,
            icon: 'Briefcase',
          });
        }
      }

      setProactiveSuggestions(suggestions.slice(0, 3));
    } catch { /* silently fail */ }
  }, [apiFetch, macros]);

  // ── Contextual Quick Actions (page-aware) ─────────────────────────────

  useEffect(() => {
    const actions: CommandSuggestion[] = [];

    if (pathname.startsWith('/dashboard/projects/') && pathname.split('/').length >= 4) {
      const projectId = pathname.split('/')[3];
      actions.push(
        { label: 'Deploy this project', template: `Deploy project`, intent: 'Deploy', icon: 'Rocket' },
        { label: 'Create session for this project', template: `Open a session for this project`, intent: 'OpenSession', icon: 'Monitor' },
        { label: 'View project runbooks', template: 'Go to runbooks', intent: 'Navigate', icon: 'BookOpen' },
      );
    } else if (pathname === '/dashboard/projects') {
      actions.push(
        { label: 'Create a new project', template: 'Create a project called ', intent: 'CreateProject', icon: 'Briefcase' },
        { label: 'Open recent project', template: 'Open my latest project', intent: 'Navigate', icon: 'Briefcase' },
      );
    } else if (pathname.startsWith('/dashboard/sessions')) {
      actions.push(
        { label: 'Start a new session', template: 'Open a new session', intent: 'OpenSession', icon: 'Monitor' },
        { label: 'Start a TypeScript session', template: 'Open a TypeScript session', intent: 'OpenSession', icon: 'Monitor' },
      );
    } else if (pathname.startsWith('/dashboard/deployments')) {
      actions.push(
        { label: 'Deploy to staging', template: 'Deploy to staging', intent: 'Deploy', icon: 'Rocket' },
        { label: 'View deployment metrics', template: 'Go to deployment metrics', intent: 'Navigate', icon: 'Navigation' },
      );
    } else if (pathname.startsWith('/dashboard/runbooks')) {
      actions.push(
        { label: 'Create a runbook', template: 'Create a runbook called ', intent: 'CreateRunbook', icon: 'BookOpen' },
        { label: 'Run a runbook', template: 'Run runbook ', intent: 'TriggerRunbook', icon: 'BookOpen' },
      );
    } else if (pathname.startsWith('/dashboard/snippets')) {
      actions.push(
        { label: 'Create a snippet', template: 'Go to create snippet', intent: 'Navigate', icon: 'Navigation' },
      );
    } else if (pathname.startsWith('/dashboard/blogs')) {
      actions.push(
        { label: 'Write a blog post', template: 'Go to create blog', intent: 'Navigate', icon: 'Navigation' },
      );
    } else if (pathname === '/dashboard') {
      actions.push(
        { label: 'Create a project', template: 'Create a project called ', intent: 'CreateProject', icon: 'Briefcase' },
        { label: 'Start a session', template: 'Open a new session', intent: 'OpenSession', icon: 'Monitor' },
        { label: 'View deployments', template: 'Go to deployments', intent: 'Navigate', icon: 'Rocket' },
      );
    }

    setContextualActions(actions);
  }, [pathname]);

  // Load proactive suggestions when panel opens
  useEffect(() => {
    if (isOpen) {
      generateProactiveSuggestions();
    }
  }, [isOpen, generateProactiveSuggestions]);

  // ── Keyboard shortcut: Cmd+K ──────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle, isOpen, close]);

  return (
    <SuperchargedContext.Provider
      value={{
        isOpen,
        isActivating,
        open,
        close,
        toggle,
        input,
        setInput,
        step,
        parsedCommand,
        executionResult,
        error,
        submitInput,
        confirmCommand,
        cancelCommand,
        undoLastCommand,
        reset,
        suggestions,
        loadSuggestions,
        history,
        loadHistory,
        showHistory,
        setShowHistory,
        tokenUsage,
        loadTokenUsage,
        memories,
        macros,
        loadMemories,
        loadMacros,
        deleteMemoryItem,
        deleteMacroItem,
        showManage,
        setShowManage,
        streamingText,
        isStreaming,
        proactiveSuggestions,
        contextualActions,
        currentPage: pathname,
      }}
    >
      {children}
    </SuperchargedContext.Provider>
  );
}
