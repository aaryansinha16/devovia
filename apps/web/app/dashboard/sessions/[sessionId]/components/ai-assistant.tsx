'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Lightbulb, 
  Code, 
  Sparkles,
  FileText,
  Bug,
  Trash2,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../../../../../lib/auth-context';
import ReactMarkdown from 'react-markdown';

interface AIAssistantProps {
  sessionId: string;
  language: string;
  getEditorContent?: () => string;
}

const QUICK_PROMPTS = [
  {
    icon: Code,
    title: "Explain",
    prompt: "Explain what this code does step by step",
    color: "text-blue-400"
  },
  {
    icon: Bug,
    title: "Debug",
    prompt: "Find bugs and issues in this code",
    color: "text-red-400"
  },
  {
    icon: Lightbulb,
    title: "Improve",
    prompt: "Suggest improvements for this code",
    color: "text-yellow-400"
  },
  {
    icon: FileText,
    title: "Document",
    prompt: "Add documentation and comments to this code",
    color: "text-green-400"
  }
];

type ConversationMessage = {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function AIAssistant({ sessionId, language, getEditorContent }: AIAssistantProps) {
  const { token, user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hi${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! I'm your AI coding assistant powered by GPT-4. I can help you with:

- **Explain code** - Understand complex logic
- **Debug issues** - Find and fix bugs  
- **Optimize** - Improve performance
- **Document** - Add comments and docs

Select some code in the editor, then ask me anything!`,
      timestamp: new Date()
    }
  ]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isThinking]);

  const handleSendPrompt = async () => {
    if (!prompt.trim() || !token) return;
    
    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt,
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, userMessage]);
    const currentPrompt = prompt;
    setPrompt('');
    setIsThinking(true);
    
    try {
      // Get current editor content if available
      const code = getEditorContent?.() || '';
      
      // Build conversation history for context
      const conversationHistory = conversation
        .filter(m => m.id !== '1') // Exclude welcome message
        .map(m => ({
          type: m.type,
          content: m.content
        }));

      const response = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: currentPrompt,
          code: code,
          language: language,
          conversationHistory: conversationHistory
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      const aiResponse: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.message,
        timestamp: new Date()
      };
      
      setConversation(prev => [...prev, aiResponse]);
    } catch (error: any) {
      console.error('AI error:', error);
      const errorMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}\n\nPlease make sure the API is running and OPENAI_API_KEY is configured.`,
        timestamp: new Date()
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleQuickPrompt = (quickPrompt: string) => {
    setPrompt(quickPrompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    }
  };

  const clearConversation = () => {
    setConversation([{
      id: '1',
      type: 'assistant',
      content: `Conversation cleared. How can I help you with your ${language} code?`,
      timestamp: new Date()
    }]);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/50">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white flex items-center gap-1">
                AI Assistant
                <Sparkles className="w-3 h-3 text-yellow-400" />
              </h3>
              <p className="text-xs text-slate-400">GPT-4 Powered</p>
            </div>
          </div>
          <button
            onClick={clearConversation}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
            title="Clear conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Quick actions */}
      <div className="p-3 border-b border-slate-700/50">
        <div className="flex gap-2">
          {QUICK_PROMPTS.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={() => handleQuickPrompt(item.prompt)}
                className="flex-1 flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-800/30 hover:bg-slate-700/50 border border-slate-600/30 transition-all"
              >
                <Icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-xs text-slate-300">{item.title}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Conversation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.map((message) => (
          <div key={message.id} className={`flex gap-3 ${
            message.type === 'user' ? 'flex-row-reverse' : ''
          }`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.type === 'user' 
                ? 'bg-blue-600' 
                : 'bg-gradient-to-br from-purple-500 to-blue-500'
            }`}>
              {message.type === 'user' ? (
                <span className="text-xs font-semibold text-white">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              ) : (
                <Bot className="w-3.5 h-3.5 text-white" />
              )}
            </div>
            
            <div className={`flex-1 max-w-[85%] group ${message.type === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block p-3 rounded-2xl text-sm ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-slate-800 text-slate-100 rounded-bl-md'
              }`}>
                {message.type === 'assistant' ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        code: ({ node, className, children, ...props }: any) => {
                          const isInline = !className;
                          if (isInline) {
                            return <code className="bg-slate-700 px-1 py-0.5 rounded text-blue-300" {...props}>{children}</code>;
                          }
                          return (
                            <div className="relative group/code">
                              <pre className="bg-slate-900 p-3 rounded-lg overflow-x-auto my-2">
                                <code className={className} {...props}>{children}</code>
                              </pre>
                              <button
                                onClick={() => copyToClipboard(String(children), message.id)}
                                className="absolute top-2 right-2 p-1 bg-slate-700 hover:bg-slate-600 rounded opacity-0 group-hover/code:opacity-100 transition-opacity"
                              >
                                {copiedId === message.id ? (
                                  <Check className="w-3 h-3 text-green-400" />
                                ) : (
                                  <Copy className="w-3 h-3 text-slate-300" />
                                )}
                              </button>
                            </div>
                          );
                        }
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <span className="whitespace-pre-wrap">{message.content}</span>
                )}
              </div>
              <div className={`text-xs text-slate-500 mt-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {isThinking && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-white animate-pulse" />
            </div>
            
            <div className="p-3 rounded-2xl rounded-bl-md bg-slate-800">
              <div className="flex items-center gap-2 text-slate-300">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your code..."
            className="flex-1 px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            disabled={isThinking}
          />
          <button
            onClick={handleSendPrompt}
            disabled={!prompt.trim() || isThinking}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        
        <p className="text-xs text-slate-500 mt-2 text-center">
          Press Enter to send
        </p>
      </div>
    </div>
  );
}
