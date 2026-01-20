'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
/* eslint-disable no-undef */
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  FastForward,
  Rewind,
  X,
  Film
} from 'lucide-react';
import { useAuth } from '../../../../../lib/auth-context';

interface SessionChange {
  id: string;
  userId: string;
  userName: string | null;
  userColor: string | null;
  changeType: string;
  position: number;
  length: number | null;
  content: string | null;
  timestamp: string;
}

interface PlaybackPanelProps {
  sessionId: string;
  onApplyContent: (_content: string) => void;
  onClose: () => void;
  initialContent?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function PlaybackPanel({ 
  sessionId, 
  onApplyContent, 
  onClose,
  initialContent = ''
}: PlaybackPanelProps) {
  const { token } = useAuth();
  const [changes, setChanges] = useState<SessionChange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [reconstructedContent, setReconstructedContent] = useState(initialContent);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all changes for the session
  useEffect(() => {
    fetchChanges();
  }, [sessionId, token]);

  const fetchChanges = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}/changes?limit=5000`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setChanges(data.changes || []);
      }
    } catch (error) {
      console.error('Error fetching changes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply a single change to content
  const applyChange = useCallback((content: string, change: SessionChange): string => {
    const { changeType, position, length, content: changeContent } = change;
    
    switch (changeType) {
      case 'insert':
        return content.slice(0, position) + (changeContent || '') + content.slice(position);
      case 'delete':
        return content.slice(0, position) + content.slice(position + (length || 0));
      case 'replace':
        return content.slice(0, position) + (changeContent || '') + content.slice(position + (length || 0));
      default:
        return content;
    }
  }, []);

  // Reconstruct content up to a specific index
  const reconstructToIndex = useCallback((targetIndex: number) => {
    let content = initialContent;
    for (let i = 0; i <= targetIndex && i < changes.length; i++) {
      const change = changes[i];
      if (change) {
        content = applyChange(content, change);
      }
    }
    onApplyContent(content);
  }, [changes, initialContent, applyChange, onApplyContent]);

  // Playback control
  useEffect(() => {
    if (isPlaying && currentIndex < changes.length - 1) {
      const currentChange = changes[currentIndex];
      const nextChange = changes[currentIndex + 1];
      
      // Calculate delay based on actual timestamps
      let delay = 100; // Default delay
      if (currentChange && nextChange) {
        const timeDiff = new Date(nextChange.timestamp).getTime() - new Date(currentChange.timestamp).getTime();
        delay = Math.min(Math.max(timeDiff / playbackSpeed, 50), 1000); // Clamp between 50ms and 1s
      }
      
      playbackTimerRef.current = setTimeout(() => {
        setCurrentIndex(prev => {
          const newIndex = prev + 1;
          reconstructToIndex(newIndex);
          return newIndex;
        });
      }, delay);
    } else if (currentIndex >= changes.length - 1) {
      setIsPlaying(false);
    }

    return () => {
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current);
      }
    };
  }, [isPlaying, currentIndex, changes, playbackSpeed, reconstructToIndex]);

  const handlePlay = () => {
    if (currentIndex >= changes.length - 1) {
      // Reset to beginning if at end
      setCurrentIndex(0);
      setReconstructedContent(initialContent);
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleSeek = (index: number) => {
    setIsPlaying(false);
    setCurrentIndex(index);
    reconstructToIndex(index);
  };

  const handleSkipBack = () => {
    const newIndex = Math.max(0, currentIndex - 10);
    handleSeek(newIndex);
  };

  const handleSkipForward = () => {
    const newIndex = Math.min(changes.length - 1, currentIndex + 10);
    handleSeek(newIndex);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
    setReconstructedContent(initialContent);
    onApplyContent(initialContent);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getProgressPercentage = () => {
    if (changes.length === 0) return 0;
    return (currentIndex / (changes.length - 1)) * 100;
  };

  const getCurrentChange = () => {
    return changes[currentIndex];
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/95 backdrop-blur-xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Film className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Session Playback</h3>
              <p className="text-xs text-slate-400">{changes.length} changes recorded</p>
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

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : changes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <Film className="w-12 h-12 mb-3 text-slate-600" />
          <p className="text-slate-400 text-sm">No changes recorded yet</p>
          <p className="text-slate-500 text-xs mt-1">Start editing to record your session</p>
        </div>
      ) : (
        <>
          {/* Timeline */}
          <div className="p-4 border-b border-slate-700/50">
            {/* Progress bar */}
            <div className="relative h-2 bg-slate-700 rounded-full mb-4 cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percentage = (e.clientX - rect.left) / rect.width;
                const index = Math.round(percentage * (changes.length - 1));
                handleSeek(index);
              }}
            >
              <div 
                className="absolute h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-100"
                style={{ width: `${getProgressPercentage()}%` }}
              />
              <div 
                className="absolute w-4 h-4 bg-white rounded-full shadow-lg -top-1 transform -translate-x-1/2 transition-all duration-100"
                style={{ left: `${getProgressPercentage()}%` }}
              />
            </div>

            {/* Time display */}
            <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
              <span>{changes.length > 0 && changes[0] ? formatTime(changes[0].timestamp) : '--:--'}</span>
              <span className="text-white font-medium">
                {currentIndex + 1} / {changes.length}
              </span>
              <span>{changes.length > 0 && changes[changes.length - 1] ? formatTime(changes[changes.length - 1]!.timestamp) : '--:--'}</span>
            </div>

            {/* Playback controls */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handleReset}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                title="Reset to beginning"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleSkipBack}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                title="Skip back 10 changes"
              >
                <Rewind className="w-4 h-4" />
              </button>

              <button
                onClick={isPlaying ? handlePause : handlePlay}
                className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full transition-all shadow-lg"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <button
                onClick={handleSkipForward}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                title="Skip forward 10 changes"
              >
                <FastForward className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleSeek(changes.length - 1)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                title="Go to end"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Speed control */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="text-xs text-slate-400">Speed:</span>
              {[0.5, 1, 2, 4].map(speed => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-2 py-1 text-xs rounded transition-all ${
                    playbackSpeed === speed
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Current change info */}
          {getCurrentChange() && (
            <div className="p-4 border-b border-slate-700/50 bg-slate-800/30">
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                  style={{ backgroundColor: getCurrentChange()?.userColor || '#6366f1' }}
                >
                  {getCurrentChange()?.userName?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-sm text-white font-medium">
                    {getCurrentChange()?.userName || 'Unknown'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatTime(getCurrentChange()?.timestamp || '')}
                  </p>
                </div>
                <span className={`ml-auto px-2 py-0.5 text-xs rounded ${
                  getCurrentChange()?.changeType === 'insert' 
                    ? 'bg-green-900/50 text-green-400'
                    : getCurrentChange()?.changeType === 'delete'
                    ? 'bg-red-900/50 text-red-400'
                    : 'bg-yellow-900/50 text-yellow-400'
                }`}>
                  {getCurrentChange()?.changeType}
                </span>
              </div>
              {getCurrentChange()?.content && (
                <pre className="text-xs text-slate-300 bg-slate-900/50 p-2 rounded overflow-x-auto max-h-20">
                  {getCurrentChange()?.content?.slice(0, 200)}
                  {(getCurrentChange()?.content?.length || 0) > 200 && '...'}
                </pre>
              )}
            </div>
          )}

          {/* Changes list */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {changes.slice(Math.max(0, currentIndex - 5), currentIndex + 10).map((change, idx) => {
                const actualIndex = Math.max(0, currentIndex - 5) + idx;
                const isCurrent = actualIndex === currentIndex;
                
                return (
                  <button
                    key={change.id}
                    onClick={() => handleSeek(actualIndex)}
                    className={`w-full p-2 rounded-lg text-left transition-all flex items-center gap-2 ${
                      isCurrent
                        ? 'bg-purple-600/30 border border-purple-500/50'
                        : actualIndex < currentIndex
                        ? 'bg-slate-800/30 opacity-60'
                        : 'bg-slate-800/30 hover:bg-slate-700/30'
                    }`}
                  >
                    <span className="text-xs text-slate-500 w-8">{actualIndex + 1}</span>
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: change.userColor || '#6366f1' }}
                    />
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      change.changeType === 'insert' 
                        ? 'bg-green-900/30 text-green-400'
                        : change.changeType === 'delete'
                        ? 'bg-red-900/30 text-red-400'
                        : 'bg-yellow-900/30 text-yellow-400'
                    }`}>
                      {change.changeType.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400 truncate flex-1">
                      {change.content?.slice(0, 30) || `pos: ${change.position}`}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatTime(change.timestamp)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
