'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { 
  Button, 
  Card,
  Badge
} from '@repo/ui/components';
import { 
  Users, 
  Settings, 
  Save, 
  Lock, 
  Unlock, 
  Share2, 
  Camera,
  MessageSquare,
  Bot,
  Play,
  Pause,
  Sidebar,
  Crown,
  Edit,
  Eye,
  ChevronDown,
  Clock,
  History,
  Film,
  GitBranch
} from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import { useSessionStore } from '../../../../lib/stores/session-store';
import { formatDate } from '../../../../lib/utils/date-utils';
import { CollaborativeEditor } from '../../../../components/collaborative-editor';
import ParticipantsPanel from './components/participants-panel';
import ChatPanel from './components/chat-panel';
import AIAssistant from './components/ai-assistant';
import ConsolePanel from './components/console-panel';
import HistoryPanel from './components/history-panel';
import PlaybackPanel from './components/playback-panel';
import GitPanel from './components/git-panel';

const LANGUAGE_ICONS = {
  TYPESCRIPT: '🔷',
  JAVASCRIPT: '🟨',
  PYTHON: '🐍',
  SQL: '🗄️',
  JSON: '📄',
  MARKDOWN: '📝',
  HTML: '🌐',
  CSS: '🎨',
  YAML: '⚙️'
};

interface SessionWorkspaceProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default function SessionWorkspace({ params }: SessionWorkspaceProps) {
  const { user, token } = useAuth();
  const { sessionId } = useParams();
  const {
    currentSession,
    participants,
    isLoading,
    error,
    isLocked,
    lockedBy,
    hasUnsavedChanges,
    joinSession,
    leaveSession,
    acquireLock,
    releaseLock,
    saveContent,
    createSnapshot,
    generateInviteLink
  } = useSessionStore();

  const [isAcquiringLock, setIsAcquiringLock] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPlaybackOpen, setIsPlaybackOpen] = useState(false);
  const [isGitOpen, setIsGitOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<'participants' | 'chat'>('participants');
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [consoleOutputs, setConsoleOutputs] = useState<Array<{
    id: string;
    type: 'log' | 'error' | 'warn' | 'info' | 'success';
    message: string;
    timestamp: Date;
  }>>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const editorContentRef = useRef<string>('');

  useEffect(() => {
    if (sessionId) {
      joinSession(sessionId as string);
    }
    
    return () => {
      leaveSession();
    };
  }, [sessionId]);

  const handleLockToggle = async () => {
    setIsAcquiringLock(true);
    try {
      if (isLocked) {
        await releaseLock();
      } else {
        await acquireLock();
      }
    } finally {
      setIsAcquiringLock(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveContent();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSnapshot = async () => {
    const note = prompt('Snapshot description (optional):');
    await createSnapshot(note || undefined);
  };

  const handleShare = async () => {
    try {
      const inviteLink = await generateInviteLink();
      await navigator.clipboard.writeText(inviteLink);
      alert('Invite link copied to clipboard!');
    } catch (error) {
      console.error('Failed to generate invite link:', error);
    }
  };

  const handleExecuteCode = async () => {
    if (!currentSession || !token) return;
    
    setIsExecuting(true);
    setIsConsoleOpen(true);
    
    // Add execution start message
    setConsoleOutputs(prev => [...prev, {
      id: Date.now().toString(),
      type: 'info',
      message: `Executing ${currentSession.language} code...`,
      timestamp: new Date()
    }]);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/sessions/${currentSession.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: editorContentRef.current || '',
          language: currentSession.language
        })
      });

      const result = await response.json();

      if (response.ok) {
        // Add success message
        setConsoleOutputs(prev => [...prev, {
          id: Date.now().toString(),
          type: 'success',
          message: 'Execution completed successfully',
          timestamp: new Date()
        }]);

        // Add output
        if (result.output) {
          setConsoleOutputs(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            type: 'log',
            message: result.output,
            timestamp: new Date()
          }]);
        }

        // Add errors if any
        if (result.error) {
          setConsoleOutputs(prev => [...prev, {
            id: (Date.now() + 2).toString(),
            type: 'error',
            message: result.error,
            timestamp: new Date()
          }]);
        }
      } else {
        setConsoleOutputs(prev => [...prev, {
          id: Date.now().toString(),
          type: 'error',
          message: result.error || 'Execution failed',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      setConsoleOutputs(prev => [...prev, {
        id: Date.now().toString(),
        type: 'error',
        message: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClearConsole = () => {
    setConsoleOutputs([]);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleAI = () => {
    setIsAIOpen(!isAIOpen);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 flex items-center justify-center relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-sky-500/20 dark:bg-sky-400/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/20 dark:bg-purple-400/20 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-12 shadow-2xl">
          <div className="w-12 h-12 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300 text-lg">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 flex items-center justify-center relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-sky-500/20 dark:bg-sky-400/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/20 dark:bg-purple-400/20 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-12 shadow-2xl max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            Error loading session
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-sky-500/30"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 flex items-center justify-center relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-sky-500/20 dark:bg-sky-400/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/20 dark:bg-purple-400/20 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-12 shadow-2xl max-w-md">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            Session not found
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            The session you're looking for doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-sky-500/30"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isOwner = currentSession.ownerId === user?.id;
  const canEdit = isOwner || participants.some(p => p.id === user?.id && p.role === 'EDITOR');
  const isCurrentUserLocked = isLocked && lockedBy === 'current-user';

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 flex flex-col relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-sky-500/20 dark:bg-sky-400/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/20 dark:bg-purple-400/20 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      
      {/* Header */}
      <header className="relative z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-xl transition-all"
            >
              <Sidebar className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {LANGUAGE_ICONS[currentSession.language as keyof typeof LANGUAGE_ICONS]}
              </span>
              <h1 className="text-lg font-semibold bg-gradient-to-r from-slate-800 to-sky-600 dark:from-slate-100 dark:to-sky-400 bg-clip-text text-transparent">
                {currentSession.title}
              </h1>
              {isOwner && (
                <span className="px-3 py-1 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 text-sky-700 dark:text-sky-300 rounded-lg text-xs font-medium flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Owner
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Lock status */}
            {isLocked && (
              <span className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
                isCurrentUserLocked 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                <Lock className="w-3 h-3" />
                {isCurrentUserLocked ? 'You have edit lock' : `Locked by ${lockedBy}`}
              </span>
            )}

            {/* Unsaved changes indicator */}
            {hasUnsavedChanges && (
              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg text-xs font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Unsaved
              </span>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-1">
                {/* Run button */}
                <button
                  onClick={handleExecuteCode}
                  disabled={isExecuting}
                  title="Run code"
                  className="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span className="text-sm">Run</span>
                </button>

                {canEdit && (
                  <button
                    onClick={handleLockToggle}
                    disabled={isAcquiringLock}
                    title={isCurrentUserLocked ? 'Release edit lock' : 'Acquire edit lock'}
                    className="p-2 text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-xl transition-all disabled:opacity-50"
                  >
                    {isCurrentUserLocked ? (
                      <Unlock className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </button>
                )}

                <button
                  onClick={handleSave}
                  disabled={isSaving || !hasUnsavedChanges}
                  title="Save changes"
                  className="p-2 text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                </button>

                <button
                  onClick={handleCreateSnapshot}
                  title="Create snapshot"
                  className="p-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all"
                >
                  <Camera className="w-4 h-4" />
                </button>

                <button
                  onClick={handleShare}
                  title="Share session"
                  className="p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleAI}
                  title="Toggle AI assistant"
                  className={`p-2 rounded-xl transition-all ${
                    isAIOpen 
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20'
                  }`}
                >
                  <Bot className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setIsHistoryOpen(!isHistoryOpen);
                    if (!isHistoryOpen) setIsPlaybackOpen(false);
                  }}
                  title="Version history"
                  className={`p-2 rounded-xl transition-all ${
                    isHistoryOpen 
                      ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                  }`}
                >
                  <History className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setIsPlaybackOpen(!isPlaybackOpen);
                    if (!isPlaybackOpen) {
                      setIsHistoryOpen(false);
                      setIsGitOpen(false);
                    }
                  }}
                  title="Session playback"
                  className={`p-2 rounded-xl transition-all ${
                    isPlaybackOpen 
                      ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                  }`}
                >
                  <Film className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setIsGitOpen(!isGitOpen);
                    if (!isGitOpen) {
                      setIsHistoryOpen(false);
                      setIsPlaybackOpen(false);
                    }
                  }}
                  title="Git version control"
                  className={`p-2 rounded-xl transition-all ${
                    isGitOpen 
                      ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                  }`}
                >
                  <GitBranch className="w-4 h-4" />
                </button>

              </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar */}
        {isSidebarOpen && (
          <aside className="relative z-10 w-64 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-r border-slate-200 dark:border-slate-700 flex flex-col shadow-lg animate-in slide-in-from-left duration-300">
            {/* Panel tabs */}
            <div className="border-b border-slate-200 dark:border-slate-700">
              <div className="flex">
                <button
                  onClick={() => setActivePanel('participants')}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activePanel === 'participants'
                      ? 'border-sky-500 text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  People
                </button>
                <button
                  onClick={() => setActivePanel('chat')}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activePanel === 'chat'
                      ? 'border-sky-500 text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Chat
                </button>
              </div>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-hidden">
              {activePanel === 'participants' && <ParticipantsPanel />}
              {activePanel === 'chat' && <ChatPanel sessionId={currentSession.id} />}
            </div>
          </aside>
        )}

        {/* Editor area */}
        <main className="flex-1 flex min-w-0">
          <div className="flex-1 min-w-0">
            <CollaborativeEditor
              key={currentSession.id}
              sessionId={currentSession.id}
              language={currentSession.language.toLowerCase()}
              theme="vs-dark"
              onSave={() => saveContent()}
              onContentChange={(content) => {
                editorContentRef.current = content;
              }}
              className="h-full"
            />
          </div>

          {/* AI Assistant */}
          {isAIOpen && !isHistoryOpen && (
            <aside className="relative z-10 w-80 flex-shrink-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-l border-slate-200 dark:border-slate-700 shadow-lg animate-in slide-in-from-right duration-300 h-full overflow-hidden">
              <AIAssistant 
                sessionId={currentSession.id}
                language={currentSession.language.toLowerCase()}
                getEditorContent={() => editorContentRef.current}
              />
            </aside>
          )}

          {/* History Panel */}
          {isHistoryOpen && (
            <aside className="relative z-10 w-80 flex-shrink-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-l border-slate-200 dark:border-slate-700 shadow-lg animate-in slide-in-from-right duration-300 h-full overflow-hidden">
              <HistoryPanel
                sessionId={currentSession.id}
                currentContent={editorContentRef.current}
                onRestore={(content) => {
                  // TODO: Update editor content via Yjs
                  console.log('Restoring content:', content?.slice(0, 100));
                }}
                onClose={() => setIsHistoryOpen(false)}
              />
            </aside>
          )}

          {/* Playback Panel */}
          {isPlaybackOpen && (
            <aside className="relative z-10 w-80 flex-shrink-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-l border-slate-200 dark:border-slate-700 shadow-lg animate-in slide-in-from-right duration-300 h-full overflow-hidden">
              <PlaybackPanel
                sessionId={currentSession.id}
                initialContent=""
                onApplyContent={(content) => {
                  // Preview content during playback
                  console.log('Playback content:', content?.slice(0, 100));
                }}
                onClose={() => setIsPlaybackOpen(false)}
              />
            </aside>
          )}

          {/* Git Panel */}
          {isGitOpen && (
            <aside className="relative z-10 w-80 flex-shrink-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-l border-slate-200 dark:border-slate-700 shadow-lg animate-in slide-in-from-right duration-300 h-full overflow-hidden">
              <GitPanel
                sessionId={currentSession.id}
                currentContent={editorContentRef.current}
                onContentChange={(content) => {
                  // Update editor with git content
                  console.log('Git content change:', content?.slice(0, 100));
                }}
                onClose={() => setIsGitOpen(false)}
              />
            </aside>
          )}
        </main>
        </div>

        {/* Console Panel */}
        <ConsolePanel
          isOpen={isConsoleOpen}
          onToggle={() => setIsConsoleOpen(!isConsoleOpen)}
          outputs={consoleOutputs}
          isExecuting={isExecuting}
          onClear={handleClearConsole}
        />
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 px-4 py-2 shadow-lg">
        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span>
              {participants.length} participant{participants.length !== 1 ? 's' : ''}
            </span>
            <span>•</span>
            <span>
              Last updated {formatDate(currentSession.updatedAt)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 text-sky-700 dark:text-sky-300 rounded-lg text-xs font-medium">
              {currentSession.language}
            </span>
            {currentSession.visibility === 'PUBLIC' && (
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-medium">Public</span>
            )}
            {currentSession.visibility === 'PRIVATE' && (
              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg text-xs font-medium">Private</span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
