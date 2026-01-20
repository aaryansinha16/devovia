'use client';

import { useState } from 'react';
import Image from 'next/image';
import { 
  Button, 
  Input, 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  Badge
} from '@repo/ui/components';
import { 
  Plus, 
  Crown, 
  Edit, 
  Eye, 
  MoreVertical,
  UserMinus,
  Mail,
  Circle,
  Lock,
  Zap,
  Users
} from 'lucide-react';
import { useAuth } from '../../../../../lib/auth-context';
import { useSessionStore } from '../../../../../lib/stores/session-store';
import { formatDate } from '../../../../../lib/utils/date-utils';

function InviteUserDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'EDITOR' | 'VIEWER'>('VIEWER');
  const [isInviting, setIsInviting] = useState(false);
  
  const { inviteUser } = useSessionStore();

  const handleInvite = async () => {
    if (!email.trim()) return;
    
    setIsInviting(true);
    try {
      await inviteUser(email.trim(), role);
      setEmail('');
      setRole('VIEWER');
      setOpen(false);
    } catch (error) {
      console.error('Failed to invite user:', error);
      alert('Failed to invite user. Please check the console for details.');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-3 h-3 mr-1" />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">Invite Collaborator</DialogTitle>
          <DialogDescription className="text-slate-400 mt-1">
            Invite a team member to collaborate on this coding session.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5 mt-2">
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Permission Level
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('VIEWER')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  role === 'VIEWER' 
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' 
                    : 'bg-slate-800/30 border-slate-600/30 text-slate-400 hover:bg-slate-800/50 hover:border-slate-500/50'
                }`}
              >
                <Eye className="w-5 h-5" />
                <span className="text-sm font-medium">Viewer</span>
                <span className="text-xs opacity-70">View & comment</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('EDITOR')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  role === 'EDITOR' 
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' 
                    : 'bg-slate-800/30 border-slate-600/30 text-slate-400 hover:bg-slate-800/50 hover:border-slate-500/50'
                }`}
              >
                <Edit className="w-5 h-5" />
                <span className="text-sm font-medium">Editor</span>
                <span className="text-xs opacity-70">Edit & collaborate</span>
              </button>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <button 
              onClick={() => setOpen(false)}
              className="px-5 py-2.5 text-sm font-medium text-slate-300 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl border border-slate-600/30 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleInvite}
              disabled={!email.trim() || isInviting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isInviting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Send Invite
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ParticipantItem({ participant, isOwner, canManage }: { 
  participant: any; 
  isOwner: boolean;
  canManage: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const { updateUserRole, removeUser } = useSessionStore();
  
  const handleRoleChange = async (newRole: 'EDITOR' | 'VIEWER') => {
    try {
      await updateUserRole(participant.id, newRole);
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleRemove = async () => {
    if (confirm(`Remove ${participant.name || participant.username} from this session?`)) {
      try {
        await removeUser(participant.id);
      } catch (error) {
        console.error('Failed to remove user:', error);
      }
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-700/50 rounded-lg transition-colors">
      <div className="relative">
        {participant.avatar ? (
          <Image
            src={participant.avatar}
            alt={participant.name || participant.username}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-white">
              {(participant.name || participant.username).charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Online indicator */}
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-800 ${
          participant.isOnline ? 'bg-green-500' : 'bg-gray-500'
        }`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">
            {participant.name || participant.username}
          </span>
          
          {participant.role === 'OWNER' && (
            <Crown className="w-3 h-3 text-yellow-400" />
          )}
          
          {participant.cursor && (
            <div className="flex items-center gap-1">
              <Circle className="w-2 h-2 text-blue-400 fill-current" />
              <span className="text-xs text-gray-400">
                Line {participant.cursor.line}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          <Badge 
            variant="outline" 
            className={`text-xs ${
              participant.role === 'OWNER' 
                ? 'border-yellow-500 text-yellow-400'
                : participant.role === 'EDITOR'
                ? 'border-blue-500 text-blue-400'
                : 'border-gray-500 text-gray-400'
            }`}
          >
            {participant.role === 'OWNER' && <Crown className="w-2 h-2 mr-1" />}
            {participant.role === 'EDITOR' && <Edit className="w-2 h-2 mr-1" />}
            {participant.role === 'VIEWER' && <Eye className="w-2 h-2 mr-1" />}
            {participant.role}
          </Badge>
          
          {participant.isOnline && (
            <span className="text-xs text-green-400">Online</span>
          )}
        </div>
      </div>
      
      {canManage && participant.role !== 'OWNER' && (
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-400 hover:text-white p-1"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
          
          {showMenu && (
            <div className="absolute right-0 top-8 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
              {participant.role !== 'EDITOR' && (
                <button
                  onClick={() => {
                    handleRoleChange('EDITOR');
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                >
                  <Edit className="w-3 h-3" />
                  Make Editor
                </button>
              )}
              
              {participant.role !== 'VIEWER' && (
                <button
                  onClick={() => {
                    handleRoleChange('VIEWER');
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                >
                  <Eye className="w-3 h-3" />
                  Make Viewer
                </button>
              )}
              
              <button
                onClick={() => {
                  handleRemove();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
              >
                <UserMinus className="w-3 h-3" />
                Remove
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ParticipantsPanel() {
  const { user } = useAuth();
  const { currentSession, participants, isLocked, lockedBy } = useSessionStore();
  
  if (!currentSession) return null;
  
  const isOwner = currentSession.ownerId === user?.id;
  const canManage = isOwner;
  
  // Combine session owner with participants
  const allParticipants = [
    {
      ...currentSession.owner,
      role: 'OWNER' as const,
      isOnline: true // Owner is always considered online when viewing
    },
    ...participants.filter(p => p.id !== currentSession.ownerId)
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">
            Participants ({allParticipants.length})
          </h3>
          {canManage && <InviteUserDialog />}
        </div>
        
        {/* Lock status */}
        {isLocked && (
          <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <Lock className="w-4 h-4 text-yellow-400" />
            <div className="flex-1">
              <p className="text-xs text-yellow-400 font-medium">
                Session is locked
              </p>
              <p className="text-xs text-gray-400">
                {lockedBy === 'current-user' ? 'You have edit control' : `Locked by ${lockedBy}`}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Participants list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {allParticipants.map((participant) => (
            <ParticipantItem
              key={participant.id}
              participant={participant}
              isOwner={isOwner}
              canManage={canManage}
            />
          ))}
        </div>
        
        {allParticipants.length === 1 && (
          <div className="p-4 text-center text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No collaborators yet</p>
            <p className="text-xs">Invite teammates to start collaborating</p>
          </div>
        )}
      </div>
      
      {/* Quick stats */}
      <div className="p-4 border-t border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-green-400">
              {allParticipants.filter(p => p.isOnline).length}
            </div>
            <div className="text-xs text-gray-400">Online</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-400">
              {allParticipants.filter(p => p.role === 'EDITOR' || p.role === 'OWNER').length}
            </div>
            <div className="text-xs text-gray-400">Editors</div>
          </div>
        </div>
      </div>
    </div>
  );
}
