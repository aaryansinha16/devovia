'use client';

import { useState } from 'react';
import { Button, Input } from '@repo/ui/components';
import { Send, MessageSquare } from 'lucide-react';

// Placeholder component for Phase A
// In Phase B, this will include real-time chat functionality

export default function ChatPanel() {
  const [message, setMessage] = useState('');
  const [messages] = useState([
    {
      id: '1',
      user: 'John Doe',
      content: 'Hey team! Let\'s work on this together.',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      avatar: null
    },
    {
      id: '2',
      user: 'Jane Smith',
      content: 'Sounds good! I\'ll start with the authentication part.',
      timestamp: new Date(Date.now() - 1000 * 60 * 3),
      avatar: null
    }
  ]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // TODO: Send message via WebSocket in Phase B
    console.log('Sending message:', message);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="font-semibold text-white">Session Chat</h3>
        <p className="text-xs text-gray-400 mt-1">
          Discuss changes and coordinate with your team
        </p>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-3">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-white">
                {msg.user.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-white">
                  {msg.user}
                </span>
                <span className="text-xs text-gray-500">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-gray-300 break-words">
                {msg.content}
              </p>
            </div>
          </div>
        ))}
        
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs">Start the conversation!</p>
          </div>
        )}
      </div>
      
      {/* Message input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
