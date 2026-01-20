import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { API_URL } from '../api-config';
import { getTokens } from '../auth';

// Helper function for authenticated requests
const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const tokens = getTokens();
  if (!tokens) {
    throw new Error('Not authenticated');
  }

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.accessToken}`,
      ...options.headers,
    },
  });
};

// Types for collaborative sessions
export interface CollaborativeSession {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  owner: {
    id: string;
    name?: string;
    username: string;
    avatar?: string;
  };
  visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
  language: 'TYPESCRIPT' | 'JAVASCRIPT' | 'PYTHON' | 'SQL' | 'JSON' | 'MARKDOWN' | 'HTML' | 'CSS' | 'YAML';
  content?: string;
  lockedBy?: string;
  lockedUntil?: string;
  isActive: boolean;
  inviteCode?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  permissions: SessionPermission[];
  snapshots: SessionSnapshot[];
}

export interface SessionPermission {
  id: string;
  sessionId: string;
  userId: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  joinedAt: string;
  lastActive?: string;
  user: {
    id: string;
    name?: string;
    username: string;
    avatar?: string;
  };
}

export interface SessionSnapshot {
  id: string;
  sessionId: string;
  content?: string;
  yjsState?: Uint8Array;
  createdAt: string;
  createdBy?: string;
  note?: string;
  size?: number;
}

export interface Participant {
  id: string;
  name?: string;
  username: string;
  avatar?: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  isOnline: boolean;
  cursor?: {
    line: number;
    column: number;
  };
  selection?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
}

interface SessionStore {
  // Session data
  sessions: CollaborativeSession[];
  currentSession: CollaborativeSession | null;
  participants: Participant[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  activePanel: 'code' | 'participants' | 'chat' | 'ai';
  isAIOpen: boolean;
  isSidebarOpen: boolean;
  
  // Editor state (Phase A)
  content: string;
  isLocked: boolean;
  lockedBy?: string;
  hasUnsavedChanges: boolean;
  
  // Real-time state (Phase B - will be added later)
  document: any | null; // Y.Doc
  awareness: any | null; // Awareness
  provider: any | null; // WebSocketProvider
  
  // Actions
  // Session management
  fetchSessions: () => Promise<void>;
  createSession: (data: { title: string; description?: string; language?: string; visibility?: string }) => Promise<CollaborativeSession>;
  joinSession: (sessionId: string) => Promise<void>;
  leaveSession: () => void;
  deleteSession: (sessionId: string) => Promise<void>;
  
  // Content management (Phase A)
  updateContent: (content: string) => void;
  saveContent: () => Promise<void>;
  acquireLock: () => Promise<boolean>;
  releaseLock: () => Promise<void>;
  
  // Snapshots
  createSnapshot: (note?: string) => Promise<void>;
  loadSnapshot: (snapshotId: string) => Promise<void>;
  
  // Permissions
  inviteUser: (email: string, role: 'EDITOR' | 'VIEWER') => Promise<void>;
  updateUserRole: (userId: string, role: 'EDITOR' | 'VIEWER') => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  generateInviteLink: () => Promise<string>;
  
  // UI actions
  setActivePanel: (panel: 'code' | 'participants' | 'chat' | 'ai') => void;
  toggleAI: () => void;
  toggleSidebar: () => void;
  clearError: () => void;
  setError: (error: string) => void;
}

export const useSessionStore = create<SessionStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      sessions: [],
      currentSession: null,
      participants: [],
      
      // UI state
      isLoading: false,
      error: null,
      activePanel: 'code',
      isAIOpen: false,
      isSidebarOpen: true,
      
      // Editor state
      content: '',
      isLocked: false,
      lockedBy: undefined,
      hasUnsavedChanges: false,
      
      // Real-time state
      document: null,
      awareness: null,
      provider: null,
      
      // Actions
      fetchSessions: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await authenticatedFetch(`${API_URL}/collaborative-sessions`);
          if (!response.ok) throw new Error('Failed to fetch sessions');
          
          const sessions = await response.json();
          set({ sessions, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false 
          });
        }
      },
      
      createSession: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authenticatedFetch(`${API_URL}/collaborative-sessions`, {
            method: 'POST',
            body: JSON.stringify(data)
          });
          
          if (!response.ok) throw new Error('Failed to create session');
          
          const session = await response.json();
          set(state => ({ 
            sessions: [session, ...state.sessions],
            isLoading: false 
          }));
          
          return session;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false 
          });
          throw error;
        }
      },
      
      joinSession: async (sessionId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authenticatedFetch(`${API_URL}/collaborative-sessions/${sessionId}`);
          if (!response.ok) throw new Error('Failed to join session');
          
          const session = await response.json();
          set({ 
            currentSession: session,
            content: session.content || '',
            participants: session.permissions.map((p: SessionPermission) => ({
              ...p.user,
              role: p.role,
              isOnline: false // Will be updated by real-time system
            })),
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false 
          });
        }
      },
      
      leaveSession: () => {
        const { provider, document } = get();
        
        // Cleanup real-time connections (Phase B)
        if (provider) provider.destroy();
        if (document) document.destroy();
        
        set({
          currentSession: null,
          participants: [],
          content: '',
          isLocked: false,
          lockedBy: undefined,
          hasUnsavedChanges: false,
          document: null,
          provider: null,
          awareness: null
        });
      },
      
      deleteSession: async (sessionId: string) => {
        try {
          const response = await authenticatedFetch(`${API_URL}/collaborative-sessions/${sessionId}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) throw new Error('Failed to delete session');
          
          set(state => ({
            sessions: state.sessions.filter(s => s.id !== sessionId),
            currentSession: state.currentSession?.id === sessionId ? null : state.currentSession
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      },
      
      updateContent: (content: string) => {
        set({ content, hasUnsavedChanges: true });
      },
      
      saveContent: async () => {
        const { currentSession, content } = get();
        if (!currentSession) return;
        
        try {
          const response = await authenticatedFetch(`${API_URL}/collaborative-sessions/${currentSession.id}`, {
            method: 'PUT',
            body: JSON.stringify({ content })
          });
          
          if (!response.ok) throw new Error('Failed to save content');
          
          set({ hasUnsavedChanges: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      },
      
      acquireLock: async () => {
        const { currentSession } = get();
        if (!currentSession) return false;
        
        try {
          const response = await authenticatedFetch(`${API_URL}/collaborative-sessions/${currentSession.id}/lock`, {
            method: 'POST'
          });
          
          if (!response.ok) return false;
          
          const result = await response.json();
          set({ isLocked: result.locked, lockedBy: result.locked ? 'current-user' : undefined });
          return result.locked;
        } catch (error) {
          return false;
        }
      },
      
      releaseLock: async () => {
        const { currentSession } = get();
        if (!currentSession) return;
        
        try {
          await authenticatedFetch(`${API_URL}/collaborative-sessions/${currentSession.id}/unlock`, {
            method: 'POST'
          });
          
          set({ isLocked: false, lockedBy: undefined });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      },
      
      createSnapshot: async (note?: string) => {
        const { currentSession, content } = get();
        if (!currentSession) return;
        
        try {
          const response = await authenticatedFetch(`${API_URL}/collaborative-sessions/${currentSession.id}/snapshots`, {
            method: 'POST',
            body: JSON.stringify({ content, note })
          });
          
          if (!response.ok) throw new Error('Failed to create snapshot');
          
          // Refresh session data to get new snapshot
          get().joinSession(currentSession.id);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      },
      
      loadSnapshot: async (snapshotId: string) => {
        try {
          const response = await authenticatedFetch(`${API_URL}/session-snapshots/${snapshotId}`);
          if (!response.ok) throw new Error('Failed to load snapshot');
          
          const snapshot = await response.json();
          set({ content: snapshot.content || '', hasUnsavedChanges: true });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      },
      
      inviteUser: async (email: string, role: 'EDITOR' | 'VIEWER') => {
        const { currentSession } = get();
        if (!currentSession) return;
        
        try {
          const response = await authenticatedFetch(`${API_URL}/collaborative-sessions/${currentSession.id}/invite`, {
            method: 'POST',
            body: JSON.stringify({ email, role })
          });
          
          if (!response.ok) throw new Error('Failed to invite user');
          
          // Refresh session to get updated permissions
          get().joinSession(currentSession.id);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      },
      
      updateUserRole: async (userId: string, role: 'EDITOR' | 'VIEWER') => {
        const { currentSession } = get();
        if (!currentSession) return;
        
        try {
          const response = await authenticatedFetch(`${API_URL}/collaborative-sessions/${currentSession.id}/permissions/${userId}`, {
            method: 'PUT',
            body: JSON.stringify({ role })
          });
          
          if (!response.ok) throw new Error('Failed to update user role');
          
          // Update local state
          set(state => ({
            participants: state.participants.map(p => 
              p.id === userId ? { ...p, role } : p
            )
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      },
      
      removeUser: async (userId: string) => {
        const { currentSession } = get();
        if (!currentSession) return;
        
        try {
          const response = await authenticatedFetch(`${API_URL}/collaborative-sessions/${currentSession.id}/permissions/${userId}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) throw new Error('Failed to remove user');
          
          set(state => ({
            participants: state.participants.filter(p => p.id !== userId)
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      },
      
      generateInviteLink: async () => {
        const { currentSession } = get();
        if (!currentSession) throw new Error('No active session');
        
        try {
          const response = await authenticatedFetch(`${API_URL}/collaborative-sessions/${currentSession.id}/invite-link`, {
            method: 'POST'
          });
          
          if (!response.ok) throw new Error('Failed to generate invite link');
          
          const result = await response.json();
          return result.inviteLink;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error' });
          throw error;
        }
      },
      
      // UI actions
      setActivePanel: (panel) => set({ activePanel: panel }),
      toggleAI: () => set(state => ({ isAIOpen: !state.isAIOpen })),
      toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
      clearError: () => set({ error: null }),
      setError: (error) => set({ error })
    })),
    { name: 'session-store' }
  )
);

// Subscribe to session changes for auto-save
useSessionStore.subscribe(
  (state) => state.hasUnsavedChanges,
  (hasUnsavedChanges) => {
    if (hasUnsavedChanges) {
      // Auto-save after 2 seconds of inactivity
      const timeoutId = setTimeout(() => {
        useSessionStore.getState().saveContent();
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }
);
