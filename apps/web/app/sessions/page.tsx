'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Button, 
  Card,
  Badge
} from '@repo/ui/components';
import { 
  Plus, 
  Users, 
  Lock, 
  Calendar
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { useSessionStore } from '../../lib/stores/session-store';
import { formatDate } from '../../lib/utils/date-utils';

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



function CreateSessionDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('TYPESCRIPT');
  const [visibility, setVisibility] = useState('PRIVATE');
  const [isCreating, setIsCreating] = useState(false);
  
  const { createSession } = useSessionStore();

  const handleCreate = async () => {
    if (!title.trim()) return;
    
    setIsCreating(true);
    try {
      await createSession({
        title: title.trim(),
        description: description.trim() || undefined,
        language,
        visibility
      });
      
      // Reset form
      setTitle('');
      setDescription('');
      setLanguage('TYPESCRIPT');
      setVisibility('PRIVATE');
      setOpen(false);
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Button 
        className="bg-blue-600 hover:bg-blue-700"
        onClick={() => setOpen(true)}
      >
        <Plus className="w-4 h-4 mr-2" />
        New Session
      </Button>
      
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4 text-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Create New Session</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                ×
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter session title..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What are you working on?"
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TYPESCRIPT">🔷 TypeScript</option>
                    <option value="JAVASCRIPT">🟨 JavaScript</option>
                    <option value="PYTHON">🐍 Python</option>
                    <option value="SQL">🗄️ SQL</option>
                    <option value="JSON">📄 JSON</option>
                    <option value="MARKDOWN">📝 Markdown</option>
                    <option value="HTML">🌐 HTML</option>
                    <option value="CSS">🎨 CSS</option>
                    <option value="YAML">⚙️ YAML</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Visibility
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PRIVATE">🔒 Private</option>
                    <option value="UNLISTED">👁️ Unlisted</option>
                    <option value="PUBLIC">🌍 Public</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreate}
                  disabled={!title.trim() || isCreating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isCreating ? 'Creating...' : 'Create Session'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SessionCard({ session }: { session: any }) {
  const participantCount = session.permissions?.length || 1;
  const createdDate = new Date(session.createdAt).toLocaleDateString();
  
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">
              {LANGUAGE_ICONS[session.language as keyof typeof LANGUAGE_ICONS] || '📝'}
            </span>
            <h3 className="font-medium text-white text-lg">
              {session.title}
            </h3>
          </div>
          
          {session.description && (
            <p className="text-sm text-gray-400 mb-2 line-clamp-2">
              {session.description}
            </p>
          )}
          
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {participantCount}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {createdDate}
            </span>
            <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs">
              {session.language}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {session.lockedBy && (
            <span className="text-xs text-red-400 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Locked
            </span>
          )}
          {session.visibility === 'PRIVATE' && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Private
            </span>
          )}
        </div>
        
        <Link href={`/sessions/${session.id}`}>
          <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors">
            Open
          </button>
        </Link>
      </div>
    </div>
  );
}

function SessionCardSkeleton() {
  return (
    <div className="bg-gray-800 border-gray-700 rounded-lg border p-4">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 bg-gray-700 rounded animate-pulse" />
              <div className="h-5 bg-gray-700 rounded animate-pulse w-32" />
            </div>
            <div className="h-4 bg-gray-700 rounded animate-pulse w-full mb-2" />
            <div className="h-4 bg-gray-700 rounded animate-pulse w-2/3" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-gray-700 rounded animate-pulse" />
            <div className="h-6 w-12 bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex justify-between">
          <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
          <div className="h-8 w-16 bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const { user, isAuthenticated } = useAuth();
  const { sessions, isLoading, error, fetchSessions } = useSessionStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions();
    }
  }, [isAuthenticated, fetchSessions]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Sign in to continue
          </h1>
          <p className="text-gray-400 mb-6">
            You need to be signed in to access collaborative sessions.
          </p>
          <Link href="/login">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Collaborative Sessions
            </h1>
            <p className="text-gray-400">
              Code, debug, and collaborate with your team in real-time
            </p>
          </div>
          <CreateSessionDialog />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 border-gray-700 rounded-lg border p-4">
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {sessions.length}
              </div>
              <div className="text-sm text-gray-400">Total Sessions</div>
            </div>
          </div>
          <div className="bg-gray-800 border-gray-700 rounded-lg border p-4">
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {sessions.filter(s => s.isActive).length}
              </div>
              <div className="text-sm text-gray-400">Active Sessions</div>
            </div>
          </div>
          <div className="bg-gray-800 border-gray-700 rounded-lg border p-4">
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">
                {sessions.reduce((acc, s) => acc + (s.permissions?.length || 0), 0)}
              </div>
              <div className="text-sm text-gray-400">Collaborators</div>
            </div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Sessions grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SessionCardSkeleton key={i} />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No sessions yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first collaborative session to get started.
            </p>
            <CreateSessionDialog />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
