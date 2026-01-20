'use client';

import { useState, useEffect, useRef } from 'react';
import { Terminal, Play, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface ConsoleOutput {
  id: string;
  type: 'log' | 'error' | 'warn' | 'info' | 'success';
  message: string;
  timestamp: Date;
}

interface ConsolePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  outputs: ConsoleOutput[];
  isExecuting: boolean;
  onClear: () => void;
}

export default function ConsolePanel({ 
  isOpen, 
  onToggle, 
  outputs, 
  isExecuting,
  onClear 
}: ConsolePanelProps) {
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [outputs]);

  const getOutputColor = (type: ConsoleOutput['type']) => {
    switch (type) {
      case 'error':
        return 'text-red-400';
      case 'warn':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      case 'success':
        return 'text-green-400';
      default:
        return 'text-slate-300 dark:text-slate-300';
    }
  };

  const getOutputIcon = (type: ConsoleOutput['type']) => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warn':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      default:
        return '▶';
    }
  };

  return (
    <div 
      className={`relative z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 shadow-lg transition-all duration-300 ${
        isOpen ? 'h-64' : 'h-12'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
            Console Output
          </span>
          {isExecuting && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 dark:text-green-400">Running...</span>
            </div>
          )}
          {outputs.length > 0 && !isExecuting && (
            <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded text-xs">
              {outputs.length} {outputs.length === 1 ? 'line' : 'lines'}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={onClear}
            disabled={outputs.length === 0}
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear console"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={onToggle}
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-all"
            title={isOpen ? 'Minimize console' : 'Maximize console'}
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Console output */}
      {isOpen && (
        <div className="h-[calc(100%-3rem)] overflow-y-auto bg-slate-900 dark:bg-slate-950 p-4 font-mono text-sm">
          {outputs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Terminal className="w-12 h-12 mb-2 opacity-30" />
              <p className="text-sm">No output yet</p>
              <p className="text-xs">Click the Run button to execute your code</p>
            </div>
          ) : (
            <div className="space-y-1">
              {outputs.map((output) => (
                <div key={output.id} className="flex items-start gap-2 group">
                  <span className="text-slate-600 dark:text-slate-500 text-xs mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {output.timestamp.toLocaleTimeString()}
                  </span>
                  <span className="flex-shrink-0">{getOutputIcon(output.type)}</span>
                  <pre className={`flex-1 whitespace-pre-wrap break-words ${getOutputColor(output.type)}`}>
                    {output.message}
                  </pre>
                </div>
              ))}
              <div ref={consoleEndRef} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
