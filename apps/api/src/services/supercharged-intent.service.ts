/**
 * Supercharged Mode — Two-Pass Intent Parser
 *
 * Pass 1: Deterministic regex-based parser for high-confidence commands.
 * Pass 2: OpenAI LLM fallback for natural language understanding —
 *         handles navigation, conversational queries, ambiguous commands,
 *         and anything the regex can't match.
 *
 * Supported intents:
 *   - CreateProject   (action — creates a project)
 *   - OpenSession     (action — creates a collaborative session)
 *   - ChangeProfile   (action — updates user profile)
 *   - Navigate        (navigation — redirects to a page)
 *   - Conversational  (informational — answers questions, provides help)
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ParsedIntent {
  intent: string;
  confidence: number;
  slots: Record<string, any>;
  description: string; // Human-readable summary of what will happen
  requiresConfirmation: boolean;
  // Smart command chaining — multiple intents from a single input
  chain?: ParsedIntent[];
  // LLM audit fields (only present when LLM was used)
  llmAudit?: {
    prompt: any[];       // Messages array sent to the model
    response: string;    // Raw model response
    tokensUsed: number;  // Total tokens (input + output)
    model: string;       // Model identifier
  };
}

// ─── Pattern definitions (Pass 1 — deterministic) ───────────────────────────

interface IntentPattern {
  intent: string;
  patterns: RegExp[];
  extract: (match: RegExpMatchArray, raw: string) => {
    slots: Record<string, any>;
    description: string;
    requiresConfirmation: boolean;
  };
}

const INTENT_PATTERNS: IntentPattern[] = [
  // ── CreateProject ─────────────────────────────────────────────────────
  {
    intent: 'CreateProject',
    patterns: [
      /(?:create|make|start|new|add)\s+(?:a\s+)?(?:new\s+)?project\s+(?:called|named|titled)?\s*[`"']?(?<name>[\w\-\s]+?)[`"']?\s*(?:(?:and|,|then)\s+invite\s+(?<email>[^\s,]+)(?:\s+as\s+(?<role>admin|member|viewer))?)?$/i,
      /(?:create|make|start|new|add)\s+(?:a\s+)?(?:new\s+)?project\s+[`"']?(?<name>[\w\-\s]+?)[`"']?\s*$/i,
      /(?:new|create)\s+project\s*:\s*[`"']?(?<name>[\w\-\s]+?)[`"']?\s*$/i,
    ],
    extract: (match, raw) => {
      const name = (match.groups?.name || '').trim();
      const email = match.groups?.email?.trim();
      const role = match.groups?.role?.toUpperCase() || 'MEMBER';

      let description = `Create a new project called "${name}"`;
      if (email) description += ` and invite ${email} as ${role.toLowerCase()}`;
      description += '.';

      return {
        slots: { projectName: name, inviteEmail: email, inviteRole: role },
        description,
        requiresConfirmation: true,
      };
    },
  },

  // ── OpenSession ───────────────────────────────────────────────────────
  {
    intent: 'OpenSession',
    patterns: [
      /(?:open|create|start|new|launch)\s+(?:a\s+)?(?:new\s+)?(?:collaborative\s+)?session\s+(?:for\s+(?:project\s+)?[`"']?(?<project>[\w\-\s]+?)[`"']?\s*)?(?:(?:and|,|then)\s+(?:add|invite)\s+(?<users>.+))?$/i,
      /(?:open|create|start|new|launch)\s+(?:a\s+)?(?:new\s+)?(?:collaborative\s+)?session\s*(?:called|named|titled)\s+[`"']?(?<title>[\w\-\s]+?)[`"']?\s*$/i,
      /(?:open|create|start|new|launch)\s+(?:a\s+)?(?:new\s+)?session\s*$/i,
    ],
    extract: (match, raw) => {
      const project = match.groups?.project?.trim();
      const title = match.groups?.title?.trim();
      const usersRaw = match.groups?.users?.trim();

      const users = usersRaw
        ? usersRaw.split(/[,\s]+and\s+|[,\s]+/).map((u) => u.replace(/^@/, '').trim()).filter(Boolean)
        : [];

      let description = 'Open a new collaborative session';
      if (title) description = `Open a new session called "${title}"`;
      else if (project) description += ` for project "${project}"`;
      if (users.length > 0) description += ` and invite ${users.join(', ')}`;
      description += '.';

      return {
        slots: {
          sessionTitle: title || (project ? `${project} Session` : 'New Session'),
          projectName: project,
          inviteUsers: users,
          language: 'TYPESCRIPT',
          visibility: 'PRIVATE',
        },
        description,
        requiresConfirmation: true,
      };
    },
  },

  // ── SaveMacro ───────────────────────────────────────────────────────
  {
    intent: 'SaveMacro',
    patterns: [
      /(?:save|create|add|make)\s+(?:a\s+)?(?:new\s+)?macro\s+(?:called|named|titled)\s+[`"']?(?<name>[\w\-\s]+?)[`"']?\s+(?:that|which|to)\s+(?<stepsDesc>.+)$/i,
      /(?:save|create|add|make)\s+(?:a\s+)?(?:new\s+)?macro\s+(?:called|named|titled)\s+[`"']?(?<name>[\w\-\s]+?)[`"']?\s*$/i,
    ],
    extract: (match, raw) => {
      const name = (match.groups?.name || '').trim();
      const stepsDesc = (match.groups?.stepsDesc || '').trim();

      let description = `Save a macro called "${name}"`;
      if (stepsDesc) description += ` that will: ${stepsDesc}`;
      description += '.';

      return {
        slots: { macroName: name, stepsDescription: stepsDesc || null },
        description,
        requiresConfirmation: true,
      };
    },
  },

  // ── ChangeProfile ─────────────────────────────────────────────────────
  {
    intent: 'ChangeProfile',
    patterns: [
      /(?:change|update|set|edit)\s+(?:my\s+)?(?:display\s+)?name\s+to\s+[`"']?(?<name>.+?)[`"']?\s*$/i,
      /(?:change|update|set|edit)\s+(?:my\s+)?bio\s+to\s+[`"']?(?<bio>.+?)[`"']?\s*$/i,
      /(?:change|update|set|edit)\s+(?:my\s+)?(?:username)\s+to\s+[`"']?(?<username>[\w\-]+)[`"']?\s*$/i,
      /(?:change|update|set|edit)\s+(?:my\s+)?(?:github\s*(?:url)?)\s+to\s+[`"']?(?<githubUrl>https?:\/\/.+?)[`"']?\s*$/i,
      /(?:change|update|set|edit)\s+(?:my\s+)?(?:twitter\s*(?:url)?)\s+to\s+[`"']?(?<twitterUrl>https?:\/\/.+?)[`"']?\s*$/i,
      /(?:change|update|set|edit)\s+(?:my\s+)?(?:portfolio\s*(?:url)?)\s+to\s+[`"']?(?<portfolioUrl>https?:\/\/.+?)[`"']?\s*$/i,
      /(?:change|update|set|edit)\s+(?:my\s+)?profile\b/i,
    ],
    extract: (match, raw) => {
      const fields: Record<string, string> = {};
      if (match.groups?.name) fields.name = match.groups.name.trim();
      if (match.groups?.bio) fields.bio = match.groups.bio.trim();
      if (match.groups?.username) fields.username = match.groups.username.trim();
      if (match.groups?.githubUrl) fields.githubUrl = match.groups.githubUrl.trim();
      if (match.groups?.twitterUrl) fields.twitterUrl = match.groups.twitterUrl.trim();
      if (match.groups?.portfolioUrl) fields.portfolioUrl = match.groups.portfolioUrl.trim();

      const fieldNames = Object.keys(fields);
      let description: string;
      if (fieldNames.length === 0) {
        description = 'Update your profile. What would you like to change?';
      } else {
        const changes = fieldNames.map((k) => `${k} to "${fields[k]}"`).join(', ');
        description = `Update your profile: set ${changes}.`;
      }

      return {
        slots: { profileFields: fields },
        description,
        requiresConfirmation: fieldNames.length > 0,
      };
    },
  },
];

// ─── Available commands for autocomplete suggestions ────────────────────────

export interface CommandSuggestion {
  label: string;
  template: string;
  intent: string;
  icon: string; // Icon name for frontend
}

export const AVAILABLE_COMMANDS: CommandSuggestion[] = [
  {
    label: 'Create a project',
    template: 'Create a project called ',
    intent: 'CreateProject',
    icon: 'Briefcase',
  },
  {
    label: 'Create a project and invite someone',
    template: 'Create a project called [name] and invite [email]',
    intent: 'CreateProject',
    icon: 'Briefcase',
  },
  {
    label: 'Open a collaborative session',
    template: 'Open a new session',
    intent: 'OpenSession',
    icon: 'Monitor',
  },
  {
    label: 'Open a session for a project',
    template: 'Open a session for project ',
    intent: 'OpenSession',
    icon: 'Monitor',
  },
  {
    label: 'Change my display name',
    template: 'Change my name to ',
    intent: 'ChangeProfile',
    icon: 'User',
  },
  {
    label: 'Update my bio',
    template: 'Change my bio to ',
    intent: 'ChangeProfile',
    icon: 'User',
  },
  {
    label: 'Save a macro',
    template: 'Save a macro called ',
    intent: 'SaveMacro',
    icon: 'Settings2',
  },
  {
    label: 'Deploy a site',
    template: 'Deploy ',
    intent: 'Deploy',
    icon: 'Rocket',
  },
  {
    label: 'Deploy to production',
    template: 'Deploy [site] to production',
    intent: 'Deploy',
    icon: 'Rocket',
  },
  {
    label: 'Create a runbook',
    template: 'Create a runbook called ',
    intent: 'CreateRunbook',
    icon: 'BookOpen',
  },
  {
    label: 'Go to a page',
    template: 'Go to ',
    intent: 'Navigate',
    icon: 'Navigation',
  },
  {
    label: 'Ask about Devovia',
    template: 'What can you do?',
    intent: 'Conversational',
    icon: 'MessageCircle',
  },
  {
    label: 'How do I deploy?',
    template: 'How do I deploy my app to production?',
    intent: 'Conversational',
    icon: 'HelpCircle',
  },
  {
    label: 'What are runbooks?',
    template: 'What are runbooks and how do I use them?',
    intent: 'Conversational',
    icon: 'HelpCircle',
  },
  {
    label: 'How do sessions work?',
    template: 'How do collaborative sessions work?',
    intent: 'Conversational',
    icon: 'HelpCircle',
  },
  {
    label: 'Help me get started',
    template: 'I\'m new here, how do I get started?',
    intent: 'Conversational',
    icon: 'HelpCircle',
  },
];

// ─── Pass 1: Deterministic parser ───────────────────────────────────────────

export function parseIntentDeterministic(rawInput: string): ParsedIntent | null {
  const trimmed = rawInput.trim();

  for (const pattern of INTENT_PATTERNS) {
    for (const regex of pattern.patterns) {
      const match = trimmed.match(regex);
      if (match) {
        const { slots, description, requiresConfirmation } = pattern.extract(match, trimmed);
        return {
          intent: pattern.intent,
          confidence: 1.0,
          slots,
          description,
          requiresConfirmation,
        };
      }
    }
  }

  return null; // No deterministic match — fall through to LLM
}

// ─── Pass 2: LLM fallback ──────────────────────────────────────────────────

const LLM_SYSTEM_PROMPT = `You are the Devovia Supercharged assistant — a premium AI command palette built into the Devovia developer platform.

Devovia is a developer collaboration platform with these features:
- **Dashboard** (/dashboard) — overview of all activity
- **Projects** (/dashboard/projects) — manage projects, each with chat, files, and team members
- **Collaborative Sessions** (/dashboard/sessions) — real-time code editing sessions with other developers
- **Deployments** (/dashboard/deployments) — deploy applications, view metrics, connect repos
- **Runbooks** (/dashboard/runbooks) — automated workflow runbooks
- **Snippets** (/dashboard/snippets) — save and share code snippets
- **Blogs** (/dashboard/blogs) — write and publish blog posts
- **Settings** (/dashboard/settings) — account settings, profile, preferences

You must classify the user's message into one of these intents and respond with ONLY valid JSON (no markdown, no code fences):

1. **CreateProject** — User wants to create a new project.
   Output: { "intent": "CreateProject", "confidence": 0.X, "slots": { "projectName": "...", "inviteEmail": "..." (optional), "inviteRole": "MEMBER" }, "description": "...", "requiresConfirmation": true }

2. **OpenSession** — User wants to open/create a collaborative coding session.
   Output: { "intent": "OpenSession", "confidence": 0.X, "slots": { "sessionTitle": "...", "projectName": "..." (optional), "inviteUsers": [] (optional), "language": "TYPESCRIPT", "visibility": "PRIVATE" }, "description": "...", "requiresConfirmation": true }

3. **ChangeProfile** — User wants to update their profile (name, bio, username, URLs).
   Output: { "intent": "ChangeProfile", "confidence": 0.X, "slots": { "profileFields": { "name": "...", "bio": "...", ... } }, "description": "...", "requiresConfirmation": true }

4. **Navigate** — User wants to go to a specific page or section of the app.
   Static routes:
   - /dashboard (home, main page, dashboard)
   - /dashboard/projects (projects list, my projects)
   - /dashboard/projects/create (create new project page)
   - /dashboard/sessions (sessions list, collaborative sessions)
   - /dashboard/deployments (deployments, deploys)
   - /dashboard/deployments/connect (connect a repo for deployment)
   - /dashboard/deployments/metrics (deployment metrics/analytics)
   - /dashboard/runbooks (runbooks list)
   - /dashboard/runbooks/create (create a runbook)
   - /dashboard/snippets (snippets list, code snippets)
   - /dashboard/snippets/create (create a snippet)
   - /dashboard/blogs (blogs list)
   - /dashboard/blogs/create (write a blog post)
   - /dashboard/settings (settings, account, profile settings)
   Dynamic routes (use IDs from user context):
   - /dashboard/projects/{projectId} (open a specific project)
   - /dashboard/projects/{projectId}/edit (edit a specific project)
   - /dashboard/sessions/{sessionId} (open a specific session)
   - /dashboard/runbooks/{runbookId} (open a specific runbook)
   - /dashboard/snippets/{snippetId} (open a specific snippet)
   - /dashboard/blogs/edit/{blogId} (edit a specific blog)
   Output: { "intent": "Navigate", "confidence": 0.X, "slots": { "route": "/dashboard/..." }, "description": "Navigating to ...", "requiresConfirmation": false }

5. **CreateRunbook** — User wants to create a new runbook/automation workflow from a description.
   Output: { "intent": "CreateRunbook", "confidence": 0.X, "slots": { "name": "...", "description": "...", "environment": "DEVELOPMENT|STAGING|PRODUCTION", "tags": ["deploy", "backup", ...] }, "description": "...", "requiresConfirmation": true }

6. **TriggerRunbook** — User wants to run/execute an existing runbook. Match the runbook name from user context.
   Output: { "intent": "TriggerRunbook", "confidence": 0.X, "slots": { "runbookId": "...", "runbookName": "...", "parameters": {} }, "description": "...", "requiresConfirmation": true }

7. **Deploy** — User wants to deploy a site/app (e.g. "deploy my-app to production", "deploy last build to staging"). Match the site name from the user's deployment sites context. Environment can be PRODUCTION, STAGING, or PREVIEW.
   Output: { "intent": "Deploy", "confidence": 0.X, "slots": { "siteId": "...", "siteName": "...", "environment": "PRODUCTION|STAGING|PREVIEW", "branch": "main" }, "description": "Deploying [site] to [env]", "requiresConfirmation": true }

8. **RunMacro** — User wants to run a saved automation macro (e.g. "run my morning setup", "execute deploy pipeline macro"). Match the macro name or trigger phrase from the user's macros context.
   Output: { "intent": "RunMacro", "confidence": 0.X, "slots": { "macroId": "...", "macroName": "..." }, "description": "Running macro [name]", "requiresConfirmation": true }

9. **SaveMacro** — User wants to SAVE/CREATE a new macro (e.g. "save a macro called morning-setup that creates a session and opens my project", "create a macro named deploy-pipeline"). This is DIFFERENT from RunMacro — SaveMacro creates a new macro definition, RunMacro executes an existing one. The stepsDescription should capture what the macro should do.
   Output: { "intent": "SaveMacro", "confidence": 0.X, "slots": { "macroName": "...", "stepsDescription": "..." }, "description": "Save a macro called [name] that will: [steps]", "requiresConfirmation": true }

10. **Conversational** — User is asking a question, seeking help, making a general statement, or anything that doesn't map to a direct action. This is your most versatile intent — use it for:
   - Product questions: "How do deployments work?", "What are runbooks?", "How do I invite someone?"
   - How-to guides: "How do I deploy to production?", "How do I create a runbook?"
   - Feature explanations: "What can you do?", "Tell me about collaborative sessions"
   - Troubleshooting: "My deployment failed, what should I check?", "Why can't I see my project?"
   - General chat: greetings, feedback, opinions
   Output: { "intent": "Conversational", "confidence": 0.X, "slots": { "response": "Your detailed, helpful response here" }, "description": "Your detailed, helpful response here", "requiresConfirmation": false }

**Product Knowledge Base (use this to answer questions accurately):**

- **Projects**: Workspaces for organizing code, team members, notes, and chat. Each project has members (admin, member, viewer roles), collaborative notes (real-time with Yjs), project chat, and can be linked to deployment sites. Projects can be PUBLIC or PRIVATE.
- **Collaborative Sessions**: Real-time code editing sessions powered by Yjs. Support multiple languages (TypeScript, JavaScript, Python, Go, Rust, etc.). Sessions have an owner and participants with permissions. Great for pair programming, code reviews, and live debugging.
- **Deployments**: Connect platforms (Vercel, Netlify, Railway, Render) via API tokens. Each connection can have multiple sites. Deploy to PRODUCTION, STAGING, or PREVIEW environments. Deployments include AI risk scoring (0-100) based on environment, time, recent failures. High-risk production deploys (score ≥70) are blocked with an explanation.
- **Runbooks**: Automated workflow definitions with steps, parameters, and environment targeting. Statuses: DRAFT → ACTIVE → ARCHIVED. Can be triggered manually or via orchestrators. Execution history tracks each run with status (QUEUED, RUNNING, SUCCESS, FAILED, etc.) and input parameters.
- **Snippets**: Save and share code snippets with syntax highlighting. Useful for reusable code patterns, templates, and quick references.
- **Blogs**: Write and publish blog posts with a rich editor. Share knowledge, tutorials, and updates with the community.
- **Macros**: Saved sequences of Supercharged commands that can be triggered by name. Example: a "morning setup" macro that creates a session and opens a project. Created via the API or by asking the assistant.
- **Orchestrators**: Event-driven automation rules. Define a trigger event (e.g., "deployment.failed") with optional conditions, and an action to execute automatically. Example: "When a production deploy fails, create a debugging session."
- **AI Memory**: The assistant learns your preferences over time — preferred languages, deploy environments, frequently used commands. You can also explicitly save preferences.
- **Supercharged Mode**: This AI command palette you're using right now! Supports natural language commands, voice input, command chaining, undo, and conversation memory within a session.

**How-to quick reference:**
- To deploy: "Deploy [site-name] to [production/staging/preview]" — requires a connected platform with sites.
- To create a project: "Create a project called [name]" — optionally invite members.
- To start coding together: "Open a session for [project]" or "Start a TypeScript session".
- To automate: "Create a runbook called [name] that does [steps]" or create a macro for repeated command sequences.
- To set up auto-actions: Use orchestrators via the API (e.g., auto-create a debug session when a deploy fails).

Rules:
- Be smart about understanding natural language. "Go to the home page" = Navigate to /dashboard. "Take me to my projects" = Navigate to /dashboard/projects. "Show me deployments" = Navigate to /dashboard/deployments.
- When the user refers to "latest project", "last project", "most recent project", "my newest session", etc., look up the user's workspace context (provided as a system message) and resolve to the correct item by ID. Use Navigate with the dynamic route.
- If the user says "open project X" or "go to project X", match the project name from context and navigate to /dashboard/projects/{id}.
- **When the user asks a question (how, what, why, can I, is there, tell me, explain, etc.), ALWAYS use the Conversational intent with a thorough, helpful answer.** Draw from the Product Knowledge Base above and the user's workspace context. Be specific and actionable — suggest next steps or commands they can try.
- For ambiguous commands, prefer Conversational with a helpful clarification.
- For greetings like "hi", "hello", respond conversationally and mention what you can do.
- Keep action descriptions concise, but for Conversational responses, be thorough and helpful — users are asking for information.
- confidence should be between 0.7 and 0.95 for LLM-classified intents.
- ONLY output raw JSON. No markdown fences, no explanation text outside the JSON.

**Smart Command Chaining:**
If the user's message contains multiple actions (e.g. "Create a project called X and open a session for it", "Change my name to Y and go to settings"), return a JSON object with a "chain" array containing each intent in execution order. Each element has the same shape as a single intent. Use "__PREV_PROJECT_ID__" or "__PREV_SESSION_ID__" as placeholder slot values when a later intent depends on the result of an earlier one.
Example: { "chain": [ { "intent": "CreateProject", "confidence": 0.9, "slots": { "projectName": "X" }, "description": "Creating project X", "requiresConfirmation": true }, { "intent": "Navigate", "confidence": 0.9, "slots": { "route": "/dashboard/projects/__PREV_PROJECT_ID__" }, "description": "Opening the new project", "requiresConfirmation": false } ] }
Only use chaining when the user clearly requests multiple distinct actions. For single actions, return the normal single-intent JSON.`;

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export async function parseIntentWithLLM(
  rawInput: string,
  userContext?: string,
  conversationHistory?: ConversationTurn[],
): Promise<ParsedIntent> {
  try {
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: LLM_SYSTEM_PROMPT },
    ];

    // Inject user-specific context so the LLM can resolve references like "latest project"
    if (userContext) {
      messages.push({
        role: 'system',
        content: `Here is the current user's workspace context. Use this to resolve references like "latest project", "my sessions", etc.:\n\n${userContext}`,
      });
    }

    // Inject previous conversation turns for multi-turn memory (last 6 turns max)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentTurns = conversationHistory.slice(-6);
      for (const turn of recentTurns) {
        messages.push({ role: turn.role, content: turn.content });
      }
    }

    messages.push({ role: 'user', content: rawInput.trim() });

    const modelId = 'gpt-4o-mini';

    const completion = await openai.chat.completions.create({
      model: modelId,
      messages,
      max_tokens: 1200,
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) throw new Error('Empty LLM response');

    const tokensUsed =
      (completion.usage?.prompt_tokens || 0) + (completion.usage?.completion_tokens || 0);

    // Strip markdown code fences if the model wraps them anyway
    const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    const parsed = JSON.parse(cleaned);

    const auditData = {
      prompt: messages,
      response: content,
      tokensUsed,
      model: modelId,
    };

    // Handle chained intents
    if (parsed.chain && Array.isArray(parsed.chain) && parsed.chain.length > 1) {
      const chainedIntents: ParsedIntent[] = parsed.chain.map((item: any) => ({
        intent: item.intent,
        confidence: item.confidence ?? 0.8,
        slots: item.slots ?? {},
        description: item.description || '',
        requiresConfirmation: item.requiresConfirmation ?? true,
      }));

      // Return the first intent as primary, with the full chain attached
      const primary = chainedIntents[0];
      return {
        ...primary,
        description: chainedIntents.map((c, i) => `${i + 1}. ${c.description}`).join('\n'),
        requiresConfirmation: true, // Always confirm chained commands
        chain: chainedIntents,
        llmAudit: auditData,
      };
    }

    // Single intent
    if (!parsed.intent || !parsed.description) {
      throw new Error('Missing required fields in LLM response');
    }

    return {
      intent: parsed.intent,
      confidence: parsed.confidence ?? 0.8,
      slots: parsed.slots ?? {},
      description: parsed.description,
      requiresConfirmation: parsed.requiresConfirmation ?? false,
      llmAudit: auditData,
    };
  } catch (error: any) {
    console.error('LLM intent parsing failed:', error.message);

    // Graceful degradation — return a helpful conversational fallback
    return {
      intent: 'Conversational',
      confidence: 0.5,
      slots: {
        response: `I had trouble understanding that. You can try things like:\n• "Create a project called payments"\n• "Go to my deployments"\n• "Open a new session"\n• "Change my name to John"\n• Or ask me anything about Devovia!`,
      },
      description: `I had trouble understanding that. You can try things like:\n• "Create a project called payments"\n• "Go to my deployments"\n• "Open a new session"\n• "Change my name to John"\n• Or ask me anything about Devovia!`,
      requiresConfirmation: false,
    };
  }
}

// ─── Main parser (two-pass) ─────────────────────────────────────────────────

export async function parseIntent(
  rawInput: string,
  userContext?: string,
  conversationHistory?: ConversationTurn[],
): Promise<ParsedIntent> {
  // Pass 1: Try deterministic regex patterns (instant, free, high confidence)
  const deterministic = parseIntentDeterministic(rawInput);
  if (deterministic) {
    return deterministic;
  }

  // Pass 2: LLM fallback for natural language understanding
  return parseIntentWithLLM(rawInput, userContext, conversationHistory);
}

/**
 * Filter suggestions based on partial user input
 */
export function getSuggestions(partial: string): CommandSuggestion[] {
  if (!partial.trim()) return AVAILABLE_COMMANDS;

  const lower = partial.toLowerCase();
  return AVAILABLE_COMMANDS.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(lower) ||
      cmd.template.toLowerCase().includes(lower) ||
      cmd.intent.toLowerCase().includes(lower),
  );
}
