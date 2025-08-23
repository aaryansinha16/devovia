'use client';

import { useEffect, useRef, useState } from 'react';
import { Editor, Monaco } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useSessionStore } from '../../../../lib/stores/session-store';

interface CodeEditorProps {
  language: string;
  readOnly?: boolean;
}

const MONACO_LANGUAGE_MAP = {
  TYPESCRIPT: 'typescript',
  JAVASCRIPT: 'javascript',
  PYTHON: 'python',
  SQL: 'sql',
  JSON: 'json',
  MARKDOWN: 'markdown',
  HTML: 'html',
  CSS: 'css',
  YAML: 'yaml'
};

export default function CodeEditor({ language, readOnly = false }: CodeEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  
  const { content, updateContent, currentSession } = useSessionStore();

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsEditorReady(true);

    // Configure editor for collaborative features
    editor.updateOptions({
      fontSize: 14,
      fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
      fontLigatures: true,
      minimap: { enabled: true },
      wordWrap: 'on',
      lineNumbers: 'on',
      glyphMargin: true,
      folding: true,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      detectIndentation: false,
      renderWhitespace: 'selection',
      readOnly
    });

    // Handle content changes
    const model = editor.getModel();
    if (model) {
      model.onDidChangeContent(() => {
        const value = model.getValue();
        updateContent(value);
      });
    }

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Save command - handled by the parent component
      const saveEvent = new CustomEvent('editor-save');
      window.dispatchEvent(saveEvent);
    });

    // Phase B: This is where we'll add Yjs collaborative editing
    // TODO: Initialize Yjs document and Monaco binding
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateContent(value);
    }
  };

  // Get Monaco language identifier
  const monacoLanguage = MONACO_LANGUAGE_MAP[language as keyof typeof MONACO_LANGUAGE_MAP] || 'typescript';

  // Set up default content based on language
  const getDefaultContent = (lang: string) => {
    switch (lang) {
      case 'TYPESCRIPT':
        return `// Welcome to your collaborative TypeScript session!
// Start coding with your team...

interface User {
  id: string;
  name: string;
  email: string;
}

function greetUser(user: User): string {
  return \`Hello, \${user.name}!\`;
}

// Your code here...
`;
      case 'JAVASCRIPT':
        return `// Welcome to your collaborative JavaScript session!
// Start coding with your team...

function greetUser(user) {
  return \`Hello, \${user.name}!\`;
}

// Your code here...
`;
      case 'PYTHON':
        return `# Welcome to your collaborative Python session!
# Start coding with your team...

def greet_user(name):
    return f"Hello, {name}!"

if __name__ == "__main__":
    print(greet_user("World"))
    
# Your code here...
`;
      case 'SQL':
        return `-- Welcome to your collaborative SQL session!
-- Start querying with your team...

SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
GROUP BY u.id, u.name, u.email
ORDER BY post_count DESC;

-- Your queries here...
`;
      case 'JSON':
        return `{
  "welcome": "to your collaborative JSON session",
  "message": "Start editing with your team",
  "features": [
    "Real-time collaboration",
    "Cursor presence",
    "AI assistance",
    "Version snapshots"
  ],
  "data": {
    "your_data": "here"
  }
}`;
      case 'MARKDOWN':
        return `# Welcome to your collaborative Markdown session!

Start writing documentation with your team...

## Features

- **Real-time collaboration** - See changes as they happen
- **Cursor presence** - Know where your teammates are working
- **AI assistance** - Get help with writing and formatting
- **Version snapshots** - Save important milestones

## Getting Started

1. Start typing below
2. Invite your teammates
3. Collaborate in real-time!

---

Your content here...
`;
      case 'HTML':
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Collaborative HTML Session</title>
</head>
<body>
    <h1>Welcome to your collaborative HTML session!</h1>
    <p>Start building with your team...</p>
    
    <!-- Your HTML here -->
    
</body>
</html>`;
      case 'CSS':
        return `/* Welcome to your collaborative CSS session! */
/* Start styling with your team... */

:root {
  --primary-color: #3b82f6;
  --secondary-color: #64748b;
  --background: #0f172a;
  --foreground: #f8fafc;
}

body {
  font-family: 'Inter', sans-serif;
  background-color: var(--background);
  color: var(--foreground);
  margin: 0;
  padding: 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

/* Your styles here... */
`;
      case 'YAML':
        return `# Welcome to your collaborative YAML session!
# Start configuring with your team...

version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    
  database:
    image: postgres:15
    environment:
      - POSTGRES_DB=devovia
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:

# Your configuration here...
`;
      default:
        return '// Start coding with your team...';
    }
  };

  const editorValue = content || currentSession?.content || getDefaultContent(language);

  return (
    <div className="h-full bg-gray-900">
      <Editor
        height="100%"
        language={monacoLanguage}
        value={editorValue}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          fontSize: 14,
          fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
          fontLigatures: true,
          minimap: { enabled: true },
          wordWrap: 'on',
          lineNumbers: 'on',
          glyphMargin: true,
          folding: true,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          detectIndentation: false,
          renderWhitespace: 'selection',
          readOnly,
          contextmenu: true,
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          acceptSuggestionOnCommitCharacter: true,
          snippetSuggestions: 'top',
          wordBasedSuggestions: 'allDocuments',
          parameterHints: { enabled: true },
          hover: { enabled: true },
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true
          },
          colorDecorators: true,
          showFoldingControls: 'always',
          foldingHighlight: true,
          unfoldOnClickAfterEndOfLine: true,
          smoothScrolling: true,
          cursorBlinking: 'blink',
          cursorSmoothCaretAnimation: 'on'
        }}
      />
      
      {/* Collaboration indicators (Phase B) */}
      {/* TODO: Add cursor presence indicators */}
      {/* TODO: Add user avatars for active cursors */}
      {/* TODO: Add selection highlights */}
    </div>
  );
}
