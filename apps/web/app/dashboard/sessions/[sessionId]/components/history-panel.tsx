'use client';

import { useState, useEffect } from 'react';
import { 
  History, 
  Clock,
  User,
  RotateCcw, 
  Save,
  ChevronRight,
  FileText,
  GitCompare,
  X
} from 'lucide-react';
import { useAuth } from '../../../../../lib/auth-context';

interface Snapshot {
  id: string;
  version: number;
  createdAt: string;
  createdBy: string | null;
  createdByName: string | null;
  note: string | null;
  size: number | null;
  isAutoSave: boolean;
}

interface HistoryPanelProps {
  sessionId: string;
  currentContent: string;
  onRestore: (_content: string) => void;
  onClose: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function HistoryPanel({ sessionId, currentContent, onRestore, onClose }: HistoryPanelProps) {
  const { token } = useAuth();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [snapshotNote, setSnapshotNote] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSnapshot, setCompareSnapshot] = useState<Snapshot | null>(null);

  // Fetch snapshots
  useEffect(() => {
    fetchSnapshots();
  }, [sessionId, token]);

  const fetchSnapshots = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSnapshots(data.snapshots || []);
      }
    } catch (error) {
      console.error('Error fetching snapshots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSnapshotContent = async (snapshotId: string) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}/history/${snapshotId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPreviewContent(data.snapshot.content);
      }
    } catch (error) {
      console.error('Error fetching snapshot content:', error);
    }
  };

  const handleSelectSnapshot = async (snapshot: Snapshot) => {
    if (compareMode && selectedSnapshot) {
      setCompareSnapshot(snapshot);
    } else {
      setSelectedSnapshot(snapshot);
      setCompareSnapshot(null);
      await fetchSnapshotContent(snapshot.id);
    }
  };

  const handleRestore = async () => {
    if (!selectedSnapshot || !token) return;
    
    setIsRestoring(true);
    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}/restore/${selectedSnapshot.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        onRestore(data.content);
        await fetchSnapshots(); // Refresh list
        setSelectedSnapshot(null);
        setPreviewContent(null);
      }
    } catch (error) {
      console.error('Error restoring snapshot:', error);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSaveSnapshot = async () => {
    if (!token) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}/snapshot`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: currentContent,
          note: snapshotNote || undefined
        })
      });
      
      if (response.ok) {
        await fetchSnapshots();
        setShowSaveDialog(false);
        setSnapshotNote('');
      }
    } catch (error) {
      console.error('Error saving snapshot:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/95 backdrop-blur-xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <History className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Version History</h3>
              <p className="text-xs text-slate-400">{snapshots.length} versions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="p-3 border-b border-slate-700/50 flex gap-2">
        <button
          onClick={() => setShowSaveDialog(true)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all"
        >
          <Save className="w-4 h-4" />
          Save Version
        </button>
        <button
          onClick={() => {
            setCompareMode(!compareMode);
            setCompareSnapshot(null);
          }}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            compareMode 
              ? 'bg-purple-600 text-white' 
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <GitCompare className="w-4 h-4" />
          Compare
        </button>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
          <p className="text-sm text-slate-300 mb-2">Add a note (optional):</p>
          <input
            type="text"
            value={snapshotNote}
            onChange={(e) => setSnapshotNote(e.target.value)}
            placeholder="e.g., Fixed login bug"
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveSnapshot}
              disabled={isSaving}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setShowSaveDialog(false);
                setSnapshotNote('');
              }}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Compare Mode Info */}
      {compareMode && (
        <div className="px-4 py-2 bg-purple-900/30 border-b border-purple-500/30">
          <p className="text-xs text-purple-300">
            {selectedSnapshot 
              ? compareSnapshot 
                ? `Comparing v${selectedSnapshot.version} with v${compareSnapshot.version}`
                : 'Select another version to compare'
              : 'Select first version to compare'}
          </p>
        </div>
      )}

      {/* Snapshots List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : snapshots.length === 0 ? (
          <div className="text-center py-12 px-4">
            <History className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400 text-sm">No versions saved yet</p>
            <p className="text-slate-500 text-xs mt-1">Click "Save Version" to create your first snapshot</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {/* Current Version */}
            <div className="p-3 rounded-lg bg-green-900/20 border border-green-500/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-green-400">Current Version</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Live editing</p>
            </div>

            {/* Saved Snapshots */}
            {snapshots.map((snapshot) => (
              <button
                key={snapshot.id}
                onClick={() => handleSelectSnapshot(snapshot)}
                className={`w-full p-3 rounded-lg text-left transition-all ${
                  selectedSnapshot?.id === snapshot.id
                    ? 'bg-blue-600/20 border border-blue-500/50'
                    : compareSnapshot?.id === snapshot.id
                    ? 'bg-purple-600/20 border border-purple-500/50'
                    : 'bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-white">
                      Version {snapshot.version}
                    </span>
                    {snapshot.isAutoSave && (
                      <span className="px-1.5 py-0.5 bg-slate-700 text-slate-400 text-xs rounded">
                        Auto
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
                
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(snapshot.createdAt)}
                  </span>
                  {snapshot.createdByName && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {snapshot.createdByName}
                    </span>
                  )}
                  {snapshot.size && (
                    <span>{formatSize(snapshot.size)}</span>
                  )}
                </div>
                
                {snapshot.note && (
                  <p className="mt-2 text-xs text-slate-300 italic">
                    "{snapshot.note}"
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Preview & Actions */}
      {selectedSnapshot && previewContent !== null && !compareMode && (
        <div className="border-t border-slate-700/50">
          {/* Preview */}
          <div className="p-3 max-h-48 overflow-y-auto bg-slate-950/50">
            <p className="text-xs text-slate-400 mb-2">Preview:</p>
            <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
              {previewContent?.slice(0, 500)}
              {previewContent && previewContent.length > 500 && '...'}
            </pre>
          </div>
          
          {/* Restore Button */}
          <div className="p-3 flex gap-2">
            <button
              onClick={handleRestore}
              disabled={isRestoring}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg font-medium transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              {isRestoring ? 'Restoring...' : 'Restore This Version'}
            </button>
            <button
              onClick={() => {
                setSelectedSnapshot(null);
                setPreviewContent(null);
              }}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
