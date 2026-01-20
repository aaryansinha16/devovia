'use client';

import { useState, useEffect } from 'react';
import { 
  GitBranch, 
  GitCommit,
  Plus,
  X,
  RefreshCw,
  RotateCcw,
  Trash2,
  Github,
  Upload,
  Download,
  Unlink
} from 'lucide-react';
import { useAuth } from '../../../../../lib/auth-context';

interface Commit {
  hash: string;
  date: string;
  message: string;
  author: string;
  email: string;
}

interface GitStatus {
  current: string;
  isClean: boolean;
  staged: string[];
  modified: string[];
  created: string[];
  deleted: string[];
}

interface GitPanelProps {
  sessionId: string;
  currentContent: string;
  onContentChange: (_content: string) => void;
  onClose: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function GitPanel({ 
  sessionId, 
  currentContent,
  onContentChange,
  onClose 
}: GitPanelProps) {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'commits' | 'branches'>('commits');
  const [commits, setCommits] = useState<Commit[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [currentBranch, setCurrentBranch] = useState('main');
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commitMessage, setCommitMessage] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [showNewBranch, setShowNewBranch] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [githubRemote, setGithubRemote] = useState<{ connected: boolean; url?: string } | null>(null);
  const [showGithubDialog, setShowGithubDialog] = useState(false);
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    fetchGitData();
  }, [sessionId, token]);

  const fetchGitData = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      // Fetch status, log, and branches in parallel
      const [statusRes, logRes] = await Promise.all([
        fetch(`${API_URL}/git/${sessionId}/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/git/${sessionId}/log?limit=20`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus(statusData.status);
        setBranches(statusData.branches || []);
        setCurrentBranch(statusData.currentBranch || 'main');
      }

      if (logRes.ok) {
        const logData = await logRes.json();
        setCommits(logData.commits || []);
      }

      // Fetch GitHub remote info
      const remoteRes = await fetch(`${API_URL}/github/${sessionId}/remote`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (remoteRes.ok) {
        const remoteData = await remoteRes.json();
        setGithubRemote(remoteData.connected ? { connected: true, url: remoteData.remote?.url } : { connected: false });
      }
    } catch (error) {
      console.error('Error fetching git data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!token || !commitMessage.trim()) return;
    
    setIsCommitting(true);
    try {
      const response = await fetch(`${API_URL}/git/${sessionId}/commit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: commitMessage,
          content: currentContent
        })
      });

      if (response.ok) {
        setCommitMessage('');
        await fetchGitData();
      }
    } catch (error) {
      console.error('Error creating commit:', error);
    } finally {
      setIsCommitting(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!token || !newBranchName.trim()) return;
    
    try {
      const response = await fetch(`${API_URL}/git/${sessionId}/branch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ branchName: newBranchName })
      });

      if (response.ok) {
        setNewBranchName('');
        setShowNewBranch(false);
        await fetchGitData();
      }
    } catch (error) {
      console.error('Error creating branch:', error);
    }
  };

  const handleCheckout = async (branchName: string) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/git/${sessionId}/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ branchName })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentBranch(branchName);
        if (data.content) {
          onContentChange(data.content);
        }
        await fetchGitData();
      }
    } catch (error) {
      console.error('Error checking out branch:', error);
    }
  };

  const handleRevertToCommit = async (commitHash: string) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/git/${sessionId}/revert/${commitHash}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          onContentChange(data.content);
        }
        setSelectedCommit(null);
      }
    } catch (error) {
      console.error('Error reverting to commit:', error);
    }
  };

  const handleDeleteBranch = async (branchName: string) => {
    if (!token || branchName === currentBranch) return;
    
    try {
      const response = await fetch(`${API_URL}/git/${sessionId}/branch/${branchName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchGitData();
      }
    } catch (error) {
      console.error('Error deleting branch:', error);
    }
  };

  const handleConnectGithub = async () => {
    if (!token || !githubRepoUrl.trim()) return;
    
    try {
      const response = await fetch(`${API_URL}/github/${sessionId}/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ repoUrl: githubRepoUrl })
      });

      if (response.ok) {
        setShowGithubDialog(false);
        setGithubRepoUrl('');
        await fetchGitData();
      }
    } catch (error) {
      console.error('Error connecting to GitHub:', error);
    }
  };

  const handlePush = async () => {
    if (!token) return;
    
    setIsPushing(true);
    try {
      const response = await fetch(`${API_URL}/github/${sessionId}/push`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ branch: currentBranch })
      });

      if (response.ok) {
        await fetchGitData();
      }
    } catch (error) {
      console.error('Error pushing to GitHub:', error);
    } finally {
      setIsPushing(false);
    }
  };

  const handlePull = async () => {
    if (!token) return;
    
    setIsPulling(true);
    try {
      const response = await fetch(`${API_URL}/github/${sessionId}/pull`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ branch: currentBranch })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          onContentChange(data.content);
        }
        await fetchGitData();
      }
    } catch (error) {
      console.error('Error pulling from GitHub:', error);
    } finally {
      setIsPulling(false);
    }
  };

  const handleDisconnectGithub = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/github/${sessionId}/remote`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchGitData();
      }
    } catch (error) {
      console.error('Error disconnecting from GitHub:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/95 backdrop-blur-xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Git Version Control</h3>
              <p className="text-xs text-slate-400">Branch: {currentBranch}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchGitData}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Repo Info */}
        <div className="mt-3 p-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-slate-300">Session Git Repository</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 ml-4">
            Auto-created for session {sessionId.slice(0, 8)}...
          </p>
        </div>

        {/* GitHub Connection */}
        <div className="mt-3 p-3 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg border border-slate-600/50">
          {githubRemote?.connected ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4 text-white" />
                  <span className="text-xs font-medium text-white">Connected to GitHub</span>
                </div>
                <button
                  onClick={handleDisconnectGithub}
                  className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                  title="Disconnect"
                >
                  <Unlink className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-slate-400 truncate mb-3">{githubRemote.url}</p>
              <div className="flex gap-2">
                <button
                  onClick={handlePush}
                  disabled={isPushing}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-medium transition-all"
                >
                  <Upload className="w-3 h-3" />
                  {isPushing ? 'Pushing...' : 'Push'}
                </button>
                <button
                  onClick={handlePull}
                  disabled={isPulling}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded text-xs font-medium transition-all"
                >
                  <Download className="w-3 h-3" />
                  {isPulling ? 'Pulling...' : 'Pull'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {showGithubDialog ? (
                <div>
                  <p className="text-xs text-slate-300 mb-2">Enter GitHub repository URL:</p>
                  <input
                    type="text"
                    value={githubRepoUrl}
                    onChange={(e) => setGithubRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/repo.git"
                    className="w-full px-2 py-1.5 bg-slate-900/50 border border-slate-600/50 rounded text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/50 mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleConnectGithub}
                      disabled={!githubRepoUrl.trim()}
                      className="flex-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded text-xs font-medium"
                    >
                      Connect
                    </button>
                    <button
                      onClick={() => {
                        setShowGithubDialog(false);
                        setGithubRepoUrl('');
                      }}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowGithubDialog(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium transition-all"
                >
                  <Github className="w-4 h-4" />
                  Connect to GitHub
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Commit Form */}
      <div className="p-4 border-b border-slate-700/50 bg-slate-800/30">
        <div className="flex gap-2">
          <input
            type="text"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Commit message..."
            className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
          />
          <button
            onClick={handleCommit}
            disabled={isCommitting || !commitMessage.trim()}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <GitCommit className="w-4 h-4" />
            Commit
          </button>
        </div>
        {status && !status.isClean && (
          <p className="text-xs text-yellow-400 mt-2">
            {status.modified.length + status.created.length + status.deleted.length} uncommitted changes
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700/50">
        <button
          onClick={() => setActiveTab('commits')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-all ${
            activeTab === 'commits'
              ? 'text-orange-400 border-b-2 border-orange-400 bg-orange-900/10'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <GitCommit className="w-4 h-4 inline mr-2" />
          Commits ({commits.length})
        </button>
        <button
          onClick={() => setActiveTab('branches')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-all ${
            activeTab === 'branches'
              ? 'text-orange-400 border-b-2 border-orange-400 bg-orange-900/10'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <GitBranch className="w-4 h-4 inline mr-2" />
          Branches ({branches.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'commits' ? (
          <div className="p-2 space-y-1">
            {commits.length === 0 ? (
              <div className="text-center py-8">
                <GitCommit className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="text-slate-400 text-sm">No commits yet</p>
              </div>
            ) : (
              commits.map((commit, index) => (
                <button
                  key={commit.hash}
                  onClick={() => setSelectedCommit(selectedCommit?.hash === commit.hash ? null : commit)}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedCommit?.hash === commit.hash
                      ? 'bg-orange-600/20 border border-orange-500/50'
                      : 'bg-slate-800/30 hover:bg-slate-700/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className="w-3 h-3 rounded-full bg-orange-500 mt-1" />
                      {index < commits.length - 1 && (
                        <div className="absolute left-1/2 top-4 w-0.5 h-8 bg-slate-700 -translate-x-1/2" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {commit.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span className="font-mono">{commit.hash.slice(0, 7)}</span>
                        <span>•</span>
                        <span>{commit.author}</span>
                        <span>•</span>
                        <span>{formatDate(commit.date)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedCommit?.hash === commit.hash && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRevertToCommit(commit.hash);
                        }}
                        className="flex-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-medium flex items-center justify-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restore
                      </button>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {/* New Branch Button */}
            {showNewBranch ? (
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <input
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="Branch name..."
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 mb-2"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateBranch}
                    disabled={!newBranchName.trim()}
                    className="flex-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded text-xs font-medium"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowNewBranch(false);
                      setNewBranchName('');
                    }}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewBranch(true)}
                className="w-full p-3 rounded-lg bg-slate-800/30 hover:bg-slate-700/30 text-slate-400 hover:text-white transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Branch
              </button>
            )}

            {/* Branch List */}
            {branches.map((branch) => (
              <div
                key={branch}
                className={`p-3 rounded-lg flex items-center justify-between ${
                  branch === currentBranch
                    ? 'bg-orange-600/20 border border-orange-500/50'
                    : 'bg-slate-800/30 hover:bg-slate-700/30'
                }`}
              >
                <button
                  onClick={() => branch !== currentBranch && handleCheckout(branch)}
                  className="flex items-center gap-2 flex-1"
                >
                  <GitBranch className={`w-4 h-4 ${branch === currentBranch ? 'text-orange-400' : 'text-slate-400'}`} />
                  <span className={`text-sm ${branch === currentBranch ? 'text-orange-400 font-medium' : 'text-white'}`}>
                    {branch}
                  </span>
                  {branch === currentBranch && (
                    <span className="px-1.5 py-0.5 bg-orange-600 text-white text-xs rounded">
                      current
                    </span>
                  )}
                </button>
                {branch !== currentBranch && branch !== 'main' && branch !== 'master' && (
                  <button
                    onClick={() => handleDeleteBranch(branch)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    title="Delete branch"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
