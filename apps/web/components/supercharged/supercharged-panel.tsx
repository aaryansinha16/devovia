'use client';

import React, { useRef, useEffect, useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@repo/ui';
import { useSupercharged } from './supercharged-context';

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
};

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
  } = useSupercharged();

  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const speechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setShowSuggestions(false);
      submitInput();
    }
  };

  const handleSuggestionClick = (template: string) => {
    setInput(template);
    setShowSuggestions(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleHistoryToggle = () => {
    if (!showHistory) loadHistory();
    setShowHistory(!showHistory);
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

              {/* Input area */}
              <form onSubmit={handleSubmit}>
                <div className="flex items-center px-5 py-3.5 gap-3">
                  <Search className="w-[18px] h-[18px] text-slate-500 flex-shrink-0" />
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a command..."
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

              {/* Suggestions (idle state, no error) */}
              {step === 'idle' && !error && showSuggestions && suggestions.length > 0 && !showHistory && (
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
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-800 to-slate-800/60 border border-slate-700/30 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/20 transition-all duration-200 flex-shrink-0">
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

              {/* Executing step */}
              {step === 'executing' && (
                <div className="border-t border-slate-700/25 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                    </div>
                    <div>
                      <p className="text-[13px] text-slate-300">Executing command...</p>
                      <p className="text-[11px] text-slate-600">This will only take a moment</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Result step */}
              {step === 'result' && executionResult && (
                <div className="border-t border-slate-700/25 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 ${
                      executionResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/20'
                        : 'bg-red-500/10 border-red-500/20'
                    }`}>
                      {executionResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="text-[13px] text-slate-300 leading-relaxed">
                        {executionResult.message}
                      </p>
                      {executionResult.redirectUrl && executionResult.success && (
                        <p className="text-[11px] text-indigo-400/70 mt-1.5 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Redirecting...
                        </p>
                      )}
                      {executionResult.success && executionResult.canUndo && (
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
                      {!executionResult.success && (
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
