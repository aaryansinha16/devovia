'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Check,
  X,
  Loader2,
  Briefcase,
  Monitor,
  User,
  ChevronRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  History,
  Command,
  Search,
  CornerDownLeft,
  Zap,
  Navigation,
  MessageCircle,
  Undo2,
  Coins,
  Rocket,
  BookOpen,
  Mic,
  MicOff,
  HelpCircle,
  Brain,
  Settings2,
  Trash2,
  Play,
  Lightbulb,
  MapPin,
  Hash,
  Circle,
  CircleDot,
  XCircle,
} from 'lucide-react';
import { Button } from '@repo/ui';
import { useSupercharged } from './supercharged-context';
import { useCommandProgress } from '../../lib/hooks/use-command-progress';

// ─── Icon map for suggestions ───────────────────────────────────────────────

const ICON_MAP: Record<string, React.ReactNode> = {
  Briefcase: <Briefcase className="w-4 h-4" />,
  Monitor: <Monitor className="w-4 h-4" />,
  User: <User className="w-4 h-4" />,
  Navigation: <Navigation className="w-4 h-4" />,
  MessageCircle: <MessageCircle className="w-4 h-4" />,
  Rocket: <Rocket className="w-4 h-4" />,
  BookOpen: <BookOpen className="w-4 h-4" />,
  HelpCircle: <HelpCircle className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
  Lightbulb: <Lightbulb className="w-4 h-4" />,
};

// ─── Command palette actions (fuzzy-searchable) ─────────────────────────────

const PALETTE_ACTIONS = [
  { label: 'Create Project', template: 'Create a project called ', icon: 'Briefcase', keywords: 'new project create' },
  { label: 'Open Session', template: 'Open a new session', icon: 'Monitor', keywords: 'session collaborate code' },
  { label: 'Deploy', template: 'Deploy ', icon: 'Rocket', keywords: 'deploy ship production staging' },
  { label: 'Create Runbook', template: 'Create a runbook called ', icon: 'BookOpen', keywords: 'runbook automation workflow' },
  { label: 'Go to Dashboard', template: 'Go to dashboard', icon: 'Navigation', keywords: 'home dashboard main' },
  { label: 'Go to Projects', template: 'Go to projects', icon: 'Briefcase', keywords: 'projects list' },
  { label: 'Go to Sessions', template: 'Go to sessions', icon: 'Monitor', keywords: 'sessions list' },
  { label: 'Go to Deployments', template: 'Go to deployments', icon: 'Rocket', keywords: 'deployments list' },
  { label: 'Go to Runbooks', template: 'Go to runbooks', icon: 'BookOpen', keywords: 'runbooks list' },
  { label: 'Go to Snippets', template: 'Go to snippets', icon: 'Navigation', keywords: 'snippets code' },
  { label: 'Go to Blogs', template: 'Go to blogs', icon: 'Navigation', keywords: 'blogs write' },
  { label: 'Go to Settings', template: 'Go to settings', icon: 'Navigation', keywords: 'settings account profile' },
  { label: 'Change Profile', template: 'Change my name to ', icon: 'User', keywords: 'profile name bio username' },
  { label: 'Create Snippet', template: 'Go to create snippet', icon: 'Navigation', keywords: 'snippet new code' },
  { label: 'Write Blog Post', template: 'Go to create blog', icon: 'Navigation', keywords: 'blog write post' },
];

// ─── Status config ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  EXECUTED: { color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  FAILED: { color: 'text-red-400', bg: 'bg-red-500/10' },
  CANCELLED: { color: 'text-slate-500', bg: 'bg-slate-500/10' },
  PENDING: { color: 'text-amber-400', bg: 'bg-amber-500/10' },
  CONFIRMED: { color: 'text-sky-400', bg: 'bg-sky-500/10' },
};

// ─── Main Panel ─────────────────────────────────────────────────────────────

export default function SuperchargedPanel() {
  const {
    isOpen,
    close,
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
    currentPage,
  } = useSupercharged();

  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedPaletteIdx, setSelectedPaletteIdx] = useState(-1);
  const recognitionRef = useRef<any>(null);
  const speechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Real-time execution progress for chained commands
  const executingCommandId = step === 'executing' && parsedCommand?.isChained ? parsedCommand.commandId : null;
  const { steps: progressSteps, progress: commandProgress, reset: resetProgress } = useCommandProgress({
    commandId: executingCommandId,
    enabled: !!executingCommandId,
  });

  // Command palette fuzzy search
  const paletteResults = useMemo(() => {
    if (!input.trim()) return [];
    const lower = input.toLowerCase();
    return PALETTE_ACTIONS.filter(
      a => a.label.toLowerCase().includes(lower) || a.keywords.toLowerCase().includes(lower),
    ).slice(0, 6);
  }, [input]);

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  // Focus input and load token usage when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      loadSuggestions('');
      loadTokenUsage();
    }
  }, [isOpen, loadSuggestions, loadTokenUsage]);

  // Load suggestions as user types
  useEffect(() => {
    if (step === 'idle' && isOpen) {
      loadSuggestions(input);
      setShowSuggestions(true);
    }
  }, [input, step, isOpen, loadSuggestions]);

  // Load memories/macros when manage tab opens
  useEffect(() => {
    if (showManage === 'memories') loadMemories();
    if (showManage === 'macros') loadMacros();
  }, [showManage, loadMemories, loadMacros]);

  // Reset palette selection when input changes
  useEffect(() => { setSelectedPaletteIdx(-1); }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // If a palette result is selected, use it
    if (selectedPaletteIdx >= 0 && paletteResults[selectedPaletteIdx]) {
      handleSuggestionClick(paletteResults[selectedPaletteIdx].template);
      return;
    }
    if (input.trim()) {
      setShowSuggestions(false);
      submitInput();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (paletteResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedPaletteIdx(prev => Math.min(prev + 1, paletteResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedPaletteIdx(prev => Math.max(prev - 1, -1));
      }
    }
  };

  const handleSuggestionClick = (template: string) => {
    setInput(template);
    setShowSuggestions(false);
    setSelectedPaletteIdx(-1);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleHistoryToggle = () => {
    setShowManage(null);
    if (!showHistory) loadHistory();
    setShowHistory(!showHistory);
  };

  const handleManageToggle = (tab: 'memories' | 'macros') => {
    setShowHistory(false);
    setShowManage(showManage === tab ? null : tab);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Determine what to show in the idle suggestions area
  const showContextualSection = step === 'idle' && !error && !showHistory && !showManage && !input.trim();
  const showPaletteResults = step === 'idle' && !error && !showHistory && !showManage && input.trim() && paletteResults.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — premium frosted overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-[2px]"
            onClick={close}
          />

          {/* Panel — center-top Spotlight-style */}
          <motion.div
            initial={{ opacity: 0, y: -300 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -200, transition: { duration: 0.2, ease: 'easeIn' } }}
            transition={{ type: 'spring', damping: 12, stiffness: 200, mass: 0.8 }}
            className="fixed top-[12%] left-0 right-0 z-[9999] flex justify-center px-4"
          >
            {/* Tracing light border wrapper */}
            <div className="relative w-full max-w-[640px] rounded-2xl p-[2px]">
              {/* Rotating conic gradient — the tracing beam */}
              <div
                className="absolute inset-0 rounded-2xl overflow-hidden"
                aria-hidden="true"
              >
                <div
                  className="absolute inset-[-200%] animate-[supercharged-trace_15s_linear_infinite]"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0%, transparent 70%, #818cf8 78%, #a78bfa 82%, #c084fc 86%, transparent 94%, transparent 100%)',
                  }}
                />
              </div>

              {/* Inner content container */}
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.97) 0%, rgba(10, 15, 30, 0.98) 100%)',
                  boxShadow: '0 25px 80px -12px rgba(0, 0, 0, 0.7), 0 0 60px -20px rgba(99, 102, 241, 0.15)',
                }}
              >

              {/* Header */}
              <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-700/25">
                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className="text-[13px] font-semibold text-slate-200 tracking-tight">
                  Supercharged
                </span>
                <div className="flex-1" />
                <button
                  onClick={() => handleManageToggle('memories')}
                  className={`p-1.5 rounded-lg transition-all duration-200 ${
                    showManage === 'memories'
                      ? 'bg-purple-500/15 text-purple-400'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
                  }`}
                  title="AI Memory"
                >
                  <Brain className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleManageToggle('macros')}
                  className={`p-1.5 rounded-lg transition-all duration-200 ${
                    showManage === 'macros'
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
                  }`}
                  title="Macros"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleHistoryToggle}
                  className={`p-1.5 rounded-lg transition-all duration-200 ${
                    showHistory
                      ? 'bg-indigo-500/15 text-indigo-400'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
                  }`}
                  title="Command history"
                >
                  <History className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={close}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-all duration-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* History panel */}
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="max-h-72 overflow-y-auto border-b border-slate-700/25 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                      {history.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                          <History className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                          <p className="text-xs text-slate-500">No commands yet</p>
                          <p className="text-[10px] text-slate-600 mt-1">Your command history will appear here</p>
                        </div>
                      ) : (
                        <div className="py-1">
                          {history.map((item) => {
                            const status = STATUS_CONFIG[item.status] ?? { color: 'text-slate-500', bg: 'bg-slate-500/10' };
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setInput(item.rawInput);
                                  setShowHistory(false);
                                  setTimeout(() => inputRef.current?.focus(), 50);
                                }}
                                className="w-full text-left px-5 py-2.5 hover:bg-slate-800/40 transition-all duration-150 group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status.color.replace('text-', 'bg-')}`} />
                                  <span className="text-[13px] text-slate-300 flex-1 truncate group-hover:text-white transition-colors">
                                    {item.rawInput}
                                  </span>
                                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${status.bg} ${status.color}`}>
                                    {item.status}
                                  </span>
                                  <span className="text-[10px] text-slate-600 tabular-nums">
                                    {formatTime(item.createdAt)}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Memories management panel */}
              <AnimatePresence>
                {showManage === 'memories' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="max-h-72 overflow-y-auto border-b border-slate-700/25 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                      <div className="px-5 pt-3 pb-1.5 flex items-center justify-between">
                        <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Brain className="w-3 h-3" /> AI Memory
                        </p>
                        <span className="text-[10px] text-slate-600">{memories.length} items</span>
                      </div>
                      {memories.length === 0 ? (
                        <div className="px-5 py-8 text-center">
                          <Brain className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                          <p className="text-xs text-slate-500">No memories yet</p>
                          <p className="text-[10px] text-slate-600 mt-1">The assistant learns your preferences over time</p>
                        </div>
                      ) : (
                        <div className="py-1">
                          {memories.map((mem) => (
                            <div key={mem.id} className="flex items-center gap-3 px-5 py-2 hover:bg-slate-800/40 transition-all duration-150 group">
                              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">{mem.category}</span>
                                  <span className="text-[11px] text-slate-400 font-medium">{mem.key}</span>
                                </div>
                                <p className="text-[12px] text-slate-300 truncate mt-0.5">{mem.value}</p>
                              </div>
                              <span className="text-[10px] text-slate-600 flex-shrink-0">×{mem.usageCount}</span>
                              <button
                                onClick={() => deleteMemoryItem(mem.id)}
                                className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                                title="Delete memory"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Macros management panel */}
              <AnimatePresence>
                {showManage === 'macros' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="max-h-72 overflow-y-auto border-b border-slate-700/25 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                      <div className="px-5 pt-3 pb-1.5 flex items-center justify-between">
                        <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Settings2 className="w-3 h-3" /> Macros
                        </p>
                        <span className="text-[10px] text-slate-600">{macros.length} macros</span>
                      </div>
                      {macros.length === 0 ? (
                        <div className="px-5 py-8 text-center">
                          <Settings2 className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                          <p className="text-xs text-slate-500">No macros yet</p>
                          <p className="text-[10px] text-slate-600 mt-1">Create macros to automate repeated command sequences</p>
                        </div>
                      ) : (
                        <div className="py-1">
                          {macros.map((macro) => (
                            <div key={macro.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-800/40 transition-all duration-150 group">
                              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                                <Zap className="w-4 h-4 text-amber-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] text-slate-300 font-medium truncate">{macro.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {macro.trigger && (
                                    <span className="text-[10px] text-amber-400/70 flex items-center gap-0.5">
                                      <Hash className="w-2.5 h-2.5" />{macro.trigger}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-600">{(macro.steps as any[]).length} steps · {macro.runCount} runs</span>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setInput(`Run macro ${macro.name}`);
                                  setShowManage(null);
                                  setTimeout(() => inputRef.current?.focus(), 50);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                                title="Run macro"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteMacroItem(macro.id)}
                                className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                                title="Delete macro"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input area */}
              <form onSubmit={handleSubmit}>
                <div className="flex items-center px-5 py-3.5 gap-3">
                  <Search className="w-[18px] h-[18px] text-slate-500 flex-shrink-0" />
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a command or search actions..."
                    className="flex-1 bg-transparent text-[14px] text-white placeholder-slate-500 outline-none caret-indigo-400"
                    disabled={step === 'loading' || step === 'executing'}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {speechSupported && step !== 'loading' && step !== 'executing' && (
                    <button
                      type="button"
                      onClick={toggleVoiceInput}
                      className={`p-1.5 rounded-lg transition-all duration-200 flex-shrink-0 ${
                        isListening
                          ? 'bg-red-500/15 text-red-400 animate-pulse'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
                      }`}
                      title={isListening ? 'Stop listening' : 'Voice input'}
                    >
                      {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  {step === 'loading' || step === 'executing' ? (
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
                  ) : input.trim() ? (
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 transition-all duration-200 text-xs font-medium flex-shrink-0"
                    >
                      <CornerDownLeft className="w-3 h-3" />
                      <span>Run</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/50 border border-slate-700/40 flex-shrink-0">
                      <Command className="w-3 h-3 text-slate-500" />
                      <span className="text-[10px] text-slate-500 font-medium">K</span>
                    </div>
                  )}
                </div>
              </form>

              {/* Command palette results (fuzzy search while typing) */}
              {showPaletteResults && (
                <div className="border-t border-slate-700/25 max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                  <div className="px-5 pt-2.5 pb-1.5">
                    <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Command className="w-3 h-3" /> Quick Actions
                    </p>
                  </div>
                  {paletteResults.map((a, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(a.template)}
                      className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all duration-150 group ${
                        i === selectedPaletteIdx ? 'bg-indigo-500/10' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br from-slate-800 to-slate-800/60 border flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                        i === selectedPaletteIdx ? 'border-indigo-500/30 text-indigo-400' : 'border-slate-700/30 text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/20'
                      }`}>
                        {ICON_MAP[a.icon] || <Zap className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] truncate transition-colors ${i === selectedPaletteIdx ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{a.label}</p>
                        <p className="text-[11px] text-slate-600 truncate">{a.template}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                    </button>
                  ))}
                  <div className="px-5 py-2 border-t border-slate-700/15">
                    <p className="text-[10px] text-slate-600">
                      <span className="text-slate-500">↑↓</span> navigate · <span className="text-slate-500">↵</span> select · or press <span className="text-slate-500">Enter</span> to run as natural language
                    </p>
                  </div>
                </div>
              )}

              {/* Contextual + Proactive + API suggestions (idle, empty input) */}
              {showContextualSection && (
                <div className="border-t border-slate-700/25 max-h-[360px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                  {/* Proactive suggestions (memory-based) */}
                  {proactiveSuggestions.length > 0 && (
                    <>
                      <div className="px-5 pt-2.5 pb-1.5">
                        <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Lightbulb className="w-3 h-3" /> For You
                        </p>
                      </div>
                      {proactiveSuggestions.map((s, i) => (
                        <button
                          key={`proactive-${i}`}
                          onClick={() => handleSuggestionClick(s.template)}
                          className="w-full flex items-center gap-3 px-5 py-2 text-left hover:bg-slate-800/40 transition-all duration-150 group"
                        >
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                            {ICON_MAP[s.icon] || <Lightbulb className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] text-slate-300 truncate group-hover:text-white transition-colors">{s.label}</p>
                            <p className="text-[10px] text-amber-400/60 truncate">{s.reason}</p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                        </button>
                      ))}
                    </>
                  )}

                  {/* Contextual quick actions (page-aware) */}
                  {contextualActions.length > 0 && (
                    <>
                      <div className="px-5 pt-2.5 pb-1.5">
                        <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" /> This Page
                        </p>
                      </div>
                      {contextualActions.map((a, i) => (
                        <button
                          key={`ctx-${i}`}
                          onClick={() => handleSuggestionClick(a.template)}
                          className="w-full flex items-center gap-3 px-5 py-2 text-left hover:bg-slate-800/40 transition-all duration-150 group"
                        >
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                            {ICON_MAP[a.icon] || <Zap className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] text-slate-300 truncate group-hover:text-white transition-colors">{a.label}</p>
                            <p className="text-[11px] text-slate-600 truncate">{a.template}</p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                        </button>
                      ))}
                    </>
                  )}

                  {/* API suggestions */}
                  {showSuggestions && suggestions.length > 0 && (
                    <>
                      <div className="px-5 pt-2.5 pb-1.5">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Suggestions</p>
                      </div>
                      {suggestions.slice(0, 6).map((s, i) => (
                        <button
                          key={`sug-${i}`}
                          onClick={() => handleSuggestionClick(s.template)}
                          className="w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-slate-800/40 transition-all duration-150 group"
                        >
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-800 to-slate-800/60 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/20 transition-all duration-200 flex-shrink-0">
                            {ICON_MAP[s.icon] || <Zap className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] text-slate-300 truncate group-hover:text-white transition-colors">{s.label}</p>
                            <p className="text-[11px] text-slate-600 truncate">{s.template}</p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                        </button>
                      ))}
                    </>
                  )}
                  <div className="h-2" />
                </div>
              )}

              {/* Filtered suggestions when typing (from API, not palette) */}
              {step === 'idle' && !error && !showHistory && !showManage && input.trim() && !showPaletteResults && showSuggestions && suggestions.length > 0 && (
                <div className="border-t border-slate-700/25 max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                  <div className="px-5 pt-2.5 pb-1.5">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Suggestions</p>
                  </div>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(s.template)}
                      className="w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-slate-800/40 transition-all duration-150 group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-800 to-slate-800/60 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/20 transition-all duration-200 flex-shrink-0">
                        {ICON_MAP[s.icon] || <Zap className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-slate-300 truncate group-hover:text-white transition-colors">{s.label}</p>
                        <p className="text-[11px] text-slate-600 truncate">{s.template}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                    </button>
                  ))}
                  <div className="h-2" />
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="border-t border-slate-700/25 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="text-[13px] text-slate-300 leading-relaxed">{error}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={reset}
                        className="mt-2 text-indigo-400 hover:text-indigo-300 px-0"
                      >
                        Try again
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirmation step */}
              {step === 'confirm' && parsedCommand && (
                <div className="border-t border-slate-700/25 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="text-[13px] text-slate-300 leading-relaxed mb-4">
                        {parsedCommand.description}
                      </p>
                      <div className="flex items-center gap-2.5">
                        <Button
                          variant="gradient"
                          size="sm"
                          onClick={confirmCommand}
                          leftIcon={<Check className="w-3.5 h-3.5" />}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelCommand}
                          leftIcon={<X className="w-3.5 h-3.5" />}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Executing step — with real-time progress for chained commands */}
              {step === 'executing' && (
                <div className="border-t border-slate-700/25 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] text-slate-300">
                        {commandProgress?.message || 'Executing command...'}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        {parsedCommand?.isChained
                          ? `${parsedCommand.chainSteps} steps`
                          : 'This will only take a moment'}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar for chained commands */}
                  {parsedCommand?.isChained && commandProgress && (
                    <div className="mt-3 ml-11">
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${commandProgress.percent}%` }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step-by-step progress list */}
                  {progressSteps.length > 0 && (
                    <div className="mt-3 ml-11 space-y-1.5">
                      {progressSteps.map((s) => (
                        <div key={s.stepIndex} className="flex items-center gap-2">
                          {s.status === 'running' && (
                            <CircleDot className="w-3.5 h-3.5 text-indigo-400 animate-pulse flex-shrink-0" />
                          )}
                          {s.status === 'completed' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          )}
                          {s.status === 'failed' && (
                            <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                          )}
                          {s.status === 'pending' && (
                            <Circle className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                          )}
                          <span className={`text-[12px] truncate ${
                            s.status === 'running' ? 'text-indigo-300' :
                            s.status === 'completed' ? 'text-slate-400' :
                            s.status === 'failed' ? 'text-red-400' :
                            'text-slate-600'
                          }`}>
                            {s.description}
                          </span>
                          {s.status === 'failed' && s.error && (
                            <span className="text-[10px] text-red-400/70 truncate">— {s.error}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Result step — with streaming text for conversational responses */}
              {step === 'result' && executionResult && (
                <div className="border-t border-slate-700/25 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      executionResult.success
                        ? isStreaming ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
                        : 'bg-red-500/10 border-red-500/20'
                    }`}>
                      {isStreaming ? (
                        <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                      ) : executionResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 pt-0.5">
                      {/* Show streaming text for conversational, otherwise show full result */}
                      {isStreaming || streamingText ? (
                        <p className="text-[13px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {streamingText}
                          {isStreaming && <span className="inline-block w-[2px] h-[14px] bg-indigo-400 ml-0.5 animate-pulse align-middle" />}
                        </p>
                      ) : (
                        <p className="text-[13px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {executionResult.message}
                        </p>
                      )}
                      {executionResult.redirectUrl && executionResult.success && !isStreaming && (
                        <p className="text-[11px] text-indigo-400/70 mt-1.5 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Redirecting...
                        </p>
                      )}
                      {executionResult.success && executionResult.canUndo && !isStreaming && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={undoLastCommand}
                          leftIcon={<Undo2 className="w-3.5 h-3.5" />}
                          className="mt-2 text-amber-400 hover:text-amber-300 px-0"
                        >
                          Undo
                        </Button>
                      )}
                      {!executionResult.success && !isStreaming && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={reset}
                          className="mt-2 text-indigo-400 hover:text-indigo-300 px-0"
                        >
                          Try again
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              </div>

              {/* Token usage footer */}
              {tokenUsage && (
                <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-3 h-3" />
                    <span>Today: {tokenUsage.todayTokens.toLocaleString()} tokens · {tokenUsage.todayCommands} commands</span>
                  </div>
                  <span>Total: {tokenUsage.totalTokens.toLocaleString()} tokens</span>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
