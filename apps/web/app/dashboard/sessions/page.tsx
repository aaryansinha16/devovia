'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container, Heading, Text, GlassCard, EmptyState, BackgroundDecorative, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button } from '@repo/ui';
import { 
  Plus, 
  Users, 
  Lock, 
  Calendar,
  Search,
  Filter,
  Globe,
  Play,
  Archive,
  X
} from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';
import { useSessionStore } from '../../../lib/stores/session-store';

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
        onClick={() => setOpen(true)}
        variant="gradient"
        size="md"
        leftIcon={<Plus className="w-5 h-5" />}
      >
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
          <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-0 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <Heading size="h2" variant="gradient">Create New Session</Heading>
              <Button
                onClick={() => setOpen(false)}
                variant="ghost"
                size="icon"
              >
                <span className="text-2xl text-slate-600 dark:text-slate-300">×</span>
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter session title..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-0 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What are you working on?"
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-0 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none transition-all"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Language
                  </label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TYPESCRIPT">🔷 TypeScript</SelectItem>
                      <SelectItem value="JAVASCRIPT">🟨 JavaScript</SelectItem>
                      <SelectItem value="PYTHON">🐍 Python</SelectItem>
                      <SelectItem value="SQL">🗄️ SQL</SelectItem>
                      <SelectItem value="JSON">📄 JSON</SelectItem>
                      <SelectItem value="MARKDOWN">📝 Markdown</SelectItem>
                      <SelectItem value="HTML">🌐 HTML</SelectItem>
                      <SelectItem value="CSS">🎨 CSS</SelectItem>
                      <SelectItem value="YAML">⚙️ YAML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Visibility
                  </label>
                  <Select value={visibility} onValueChange={setVisibility}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRIVATE">🔒 Private</SelectItem>
                      <SelectItem value="UNLISTED">👁️ Unlisted</SelectItem>
                      <SelectItem value="PUBLIC">🌍 Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6">
                <Button
                  onClick={() => setOpen(false)}
                  variant="secondary"
                  size="md"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!title.trim() || isCreating}
                  variant="gradient"
                  size="md"
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
    <GlassCard className="group relative p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">
              {LANGUAGE_ICONS[session.language as keyof typeof LANGUAGE_ICONS] || '📝'}
            </span>
            <h3 className="font-bold text-lg bg-gradient-to-r from-slate-800 to-sky-600 dark:from-slate-100 dark:to-sky-400 bg-clip-text text-transparent">
              {session.title}
            </h3>
          </div>
          
          {session.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
              {session.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <Users className="w-3 h-3" />
              {participantCount}
            </span>
            <span className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <Calendar className="w-3 h-3" />
              {createdDate}
            </span>
            {session.isActive && (
              <span className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Active
              </span>
            )}
            <span className="px-3 py-1 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 text-sky-700 dark:text-sky-300 rounded-lg font-medium">
              {session.language}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {session.lockedBy && (
            <span className="text-xs text-red-400 flex items-center gap-1">
              <X className="w-5 h-5" />
            </span>
          )}
          {session.visibility === 'PRIVATE' && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Private
            </span>
          )}
        </div>
        
        <Button
          href={`/dashboard/sessions/${session.id}`}
          variant="gradient"
          size="sm"
        >
          Open
        </Button>
      </div>
      </div>
    </GlassCard>
  );
}

function SessionCardSkeleton() {
  return (
    <GlassCard className="p-6">
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
    </GlassCard>
  );
}

export default function SessionsPage() {
  const { isAuthenticated } = useAuth();
  const { sessions, isLoading, error, fetchSessions } = useSessionStore();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState<string>('all');

  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions();
    }
  }, [isAuthenticated, fetchSessions]);

  // Filter sessions based on tab, search, and language
  const filteredSessions = sessions.filter(session => {
    // Tab filter
    if (activeTab === 'active' && !session.isActive) return false;
    if (activeTab === 'archived' && session.isActive) return false;
    
    // Search filter
    if (searchQuery && !session.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !session.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Language filter
    if (languageFilter !== 'all' && session.language !== languageFilter) return false;
    
    return true;
  });

  // Get unique languages for filter
  const languages = Array.from(new Set(sessions.map(s => s.language)));

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 relative overflow-hidden">
      <BackgroundDecorative variant="subtle" />

      <Container className="relative z-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <Heading size="h1" variant="gradient" spacing="sm">
              Collaborative Sessions
            </Heading>
            <Text>
              Code, debug, and collaborate with your team in real-time
            </Text>
          </div>
          <CreateSessionDialog />
        </div>

        {/* Tabs */}
        <GlassCard padding="sm" className="mb-6">
          <div className="flex gap-2">
            {(['all', 'active', 'archived'] as const).map((tab) => (
              <Button
                key={tab}
                onClick={() => setActiveTab(tab)}
                variant="ghost"
                className={`flex-1 ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {tab === 'all' && <Globe className="w-4 h-4" />}
                  {tab === 'active' && <Play className="w-4 h-4" />}
                  {tab === 'archived' && <Archive className="w-4 h-4" />}
                  <span className="capitalize">{tab}</span>
                  <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {tab === 'all' ? sessions.length : 
                     tab === 'active' ? sessions.filter(s => s.isActive).length :
                     sessions.filter(s => !s.isActive).length}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </GlassCard>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border-0 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>
          
          {/* Language Filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 z-10 pointer-events-none" />
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger className="w-full pl-12 bg-slate-900/50 rounded-xl">
                <SelectValue placeholder="All Languages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {languages.map(lang => (
                  <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <GlassCard className="group relative p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent mb-2">
                {sessions.length}
              </div>
              <div className="text-sm font-medium text-slate-400">Total Sessions</div>
            </div>
          </GlassCard>
          <GlassCard className="group relative p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent mb-2">
                {sessions.filter(s => s.isActive).length}
              </div>
              <div className="text-sm font-medium text-slate-400">Active Sessions</div>
            </div>
          </GlassCard>
          <GlassCard className="group relative p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent mb-2">
                {sessions.reduce((acc, s) => acc + (s.permissions?.length || 0), 0)}
              </div>
              <div className="text-sm font-medium text-slate-400">Collaborators</div>
            </div>
          </GlassCard>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 mb-6 shadow-lg shadow-red-200/50 dark:shadow-red-900/50">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Results count */}
        {!isLoading && filteredSessions.length > 0 && (
          <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
            Showing <span className="font-semibold text-slate-800 dark:text-slate-100">{filteredSessions.length}</span> {filteredSessions.length === 1 ? 'session' : 'sessions'}
          </div>
        )}

        {/* Sessions grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SessionCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          searchQuery || languageFilter !== 'all' ? (
            <EmptyState
              icon="🔍"
              title="No sessions found"
              description="Try adjusting your search or filters."
              action={
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setLanguageFilter('all');
                    setActiveTab('all');
                  }}
                  variant="gradient"
                  size="md"
                >
                  Clear Filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon="📝"
              title={`No ${activeTab === 'active' ? 'active' : activeTab === 'archived' ? 'archived' : ''} sessions`}
              description={
                activeTab === 'active' ? 'Start a new session to collaborate with your team.' : 
                activeTab === 'archived' ? 'Your archived sessions will appear here.' :
                'Create your first collaborative session to get started.'
              }
              action={activeTab !== 'archived' ? <CreateSessionDialog /> : undefined}
            />
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
