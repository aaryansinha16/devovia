'use client';

import { useEffect, useState } from 'react';
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
  Clock
} from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';
import { useSessionStore } from '../../../lib/stores/session-store';
import { formatDate } from '../../../lib/utils/date-utils';
import { CollaborativeEditor } from '../../../components/collaborative-editor';
import ParticipantsPanel from './components/participants-panel';
import ChatPanel from './components/chat-panel';
import AIAssistant from './components/ai-assistant';

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
  const { user } = useAuth();
  const { sessionId } = useParams();
  const {
    currentSession,
    participants,
    isLoading,
    error,
    isLocked,
    lockedBy,
    hasUnsavedChanges,
    activePanel,
    isAIOpen,
    isSidebarOpen,
    joinSession,
    leaveSession,
    acquireLock,
    releaseLock,
    saveContent,
    createSnapshot,
    generateInviteLink,
    setActivePanel,
    toggleAI,
    toggleSidebar
  } = useSessionStore();

  const [isAcquiringLock, setIsAcquiringLock] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">
            Error loading session
          </h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-400 mb-4">
            Session not found
          </h1>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = currentSession.ownerId === user?.id;
  const canEdit = isOwner || participants.some(p => p.id === user?.id && p.role === 'EDITOR');
  const isCurrentUserLocked = isLocked && lockedBy === 'current-user';

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-white"
            >
              <Sidebar className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {LANGUAGE_ICONS[currentSession.language as keyof typeof LANGUAGE_ICONS]}
              </span>
              <h1 className="text-lg font-semibold text-white">
                {currentSession.title}
              </h1>
              {isOwner && (
                <Badge variant="outline" className="border-blue-500 text-blue-400">
                  <Crown className="w-3 h-3 mr-1" />
                  Owner
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Lock status */}
            {isLocked && (
              <Badge variant={isCurrentUserLocked ? "default" : "destructive"}>
                <Lock className="w-3 h-3 mr-1" />
                {isCurrentUserLocked ? 'You have edit lock' : `Locked by ${lockedBy}`}
              </Badge>
            )}

            {/* Unsaved changes indicator */}
            {hasUnsavedChanges && (
              <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                <Clock className="w-3 h-3 mr-1" />
                Unsaved
              </Badge>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-1">
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLockToggle}
                    disabled={isAcquiringLock}
                    title={isCurrentUserLocked ? 'Release edit lock' : 'Acquire edit lock'}
                    className="text-gray-400 hover:text-white"
                  >
                    {isCurrentUserLocked ? (
                      <Unlock className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !hasUnsavedChanges}
                  title="Save changes"
                  className="text-gray-400 hover:text-white"
                >
                  <Save className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCreateSnapshot}
                  title="Create snapshot"
                  className="text-gray-400 hover:text-white"
                >
                  <Camera className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  title="Share session"
                  className="text-gray-400 hover:text-white"
                >
                  <Share2 className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleAI}
                  title="Toggle AI assistant"
                  className={`${isAIOpen ? 'text-blue-400' : 'text-gray-400'} hover:text-white`}
                >
                  <Bot className="w-4 h-4" />
                </Button>

              </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {isSidebarOpen && (
          <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
            {/* Panel tabs */}
            <div className="border-b border-gray-700">
              <div className="flex">
                <button
                  onClick={() => setActivePanel('participants')}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activePanel === 'participants'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  People
                </button>
                <button
                  onClick={() => setActivePanel('chat')}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activePanel === 'chat'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
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
              {activePanel === 'chat' && <ChatPanel />}
            </div>
          </aside>
        )}

        {/* Editor area */}
        <main className="flex-1 flex">
          <div className="flex-1">
            <CollaborativeEditor
              sessionId={currentSession.id}
              language="typescript"
              theme="vs-dark"
              onSave={() => saveContent()}
              className="h-full"
            />
          </div>

          {/* AI Assistant */}
          {isAIOpen && (
            <aside className="w-80 border-l border-gray-700">
              <AIAssistant />
            </aside>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between text-sm text-gray-400">
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
            <Badge variant="outline" className="border-gray-600 text-gray-400">
              {currentSession.language}
            </Badge>
            {currentSession.visibility === 'PUBLIC' && (
              <Badge className="bg-green-600">Public</Badge>
            )}
            {currentSession.visibility === 'PRIVATE' && (
              <Badge className="bg-yellow-600">Private</Badge>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
