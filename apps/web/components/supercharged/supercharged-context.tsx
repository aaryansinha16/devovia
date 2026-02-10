'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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

interface ParsedCommand {
  commandId: string;
  intent: string;
  confidence: number;
  slots: Record<string, any>;
  description: string;
  requiresConfirmation: boolean;
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
  }, [input, apiFetch, conversationHistory]);

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
  }, [apiFetch, router, close]);

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

  // ── Token usage ────────────────────────────────────────────────────────

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
      }}
    >
      {children}
    </SuperchargedContext.Provider>
  );
}
