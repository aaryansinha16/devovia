'use client';

import { useState } from 'react';
import { Button, Input, Card } from '@repo/ui/components';
import { 
  Bot, 
  Send, 
  Lightbulb, 
  Code, 
  MessageSquare, 
  Zap,
  Sparkles,
  FileText,
  Bug
} from 'lucide-react';

// Placeholder component for Phase A
// In Phase C, this will include real AI integration

const QUICK_PROMPTS = [
  {
    icon: <Code className="w-4 h-4" />,
    title: "Explain Code",
    prompt: "Can you explain what this code does?"
  },
  {
    icon: <Bug className="w-4 h-4" />,
    title: "Find Issues",
    prompt: "Are there any bugs or issues in this code?"
  },
  {
    icon: <Lightbulb className="w-4 h-4" />,
    title: "Suggest Improvements",
    prompt: "How can I improve this code?"
  },
  {
    icon: <FileText className="w-4 h-4" />,
    title: "Add Documentation",
    prompt: "Can you add proper documentation to this code?"
  }
];

type ConversationMessage = {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export default function AIAssistant() {
  const [prompt, setPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hi! I'm your AI coding assistant. I can help you with:

• **Code explanations** - Understand complex logic
• **Bug detection** - Find and fix issues
• **Optimization** - Improve performance
• **Documentation** - Add comments and docs
• **Collaboration** - Suggest best practices

Just ask me anything about your code!`,
      timestamp: new Date()
    }
  ]);

  const handleSendPrompt = async () => {
    if (!prompt.trim()) return;
    
    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt,
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, userMessage]);
    setPrompt('');
    setIsThinking(true);
    
    // TODO: Integrate with OpenAI API in Phase C
    setTimeout(() => {
      const aiResponse: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `This is a placeholder response for: "${prompt}"\n\nIn Phase C, this will be powered by real AI that understands your code context and provides intelligent suggestions!`,
        timestamp: new Date()
      };
      
      setConversation(prev => [...prev, aiResponse]);
      setIsThinking(false);
    }, 2000);
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

  return (
    <div className="h-full bg-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">AI Assistant</h3>
          <Sparkles className="w-4 h-4 text-yellow-400" />
        </div>
        <p className="text-xs text-gray-400">
          Get instant help with your code
        </p>
      </div>
      
      {/* Quick actions */}
      <div className="p-4 border-b border-gray-700">
        <p className="text-sm font-medium text-gray-300 mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_PROMPTS.map((item, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleQuickPrompt(item.prompt)}
              className="justify-start h-auto p-2 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-1">
                  {item.icon}
                  <span className="text-xs font-medium">{item.title}</span>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>
      
      {/* Conversation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.map((message) => (
          <div key={message.id} className={`flex gap-3 ${
            message.type === 'user' ? 'flex-row-reverse' : ''
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.type === 'user' 
                ? 'bg-blue-600' 
                : 'bg-gradient-to-br from-purple-500 to-blue-500'
            }`}>
              {message.type === 'user' ? (
                <span className="text-sm font-semibold text-white">U</span>
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
            
            <div className={`flex-1 p-3 rounded-lg border ${
              message.type === 'user'
                ? 'bg-blue-600/20 border-blue-500/30'
                : 'bg-gray-700 border-gray-600'
            }`}>
              <div className="text-sm text-gray-100 whitespace-pre-wrap">
                {message.content}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isThinking && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            
            <div className="flex-1 p-3 rounded-lg border bg-gray-700 border-gray-600">
              <div className="flex items-center gap-2 text-gray-300">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your code..."
            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            disabled={isThinking}
          />
          <Button
            onClick={handleSendPrompt}
            disabled={!prompt.trim() || isThinking}
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
