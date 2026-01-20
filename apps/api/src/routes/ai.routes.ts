import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import OpenAI from 'openai';

const router = Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// POST /api/ai/chat - Chat with AI assistant
router.post('/chat', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { message, code, language, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build the system prompt
    const systemPrompt = `You are an expert coding assistant helping developers with their code. You are knowledgeable in all programming languages and best practices.

Your capabilities:
- Explain code and concepts clearly
- Find and fix bugs
- Suggest optimizations and improvements
- Add documentation and comments
- Refactor code for better readability
- Answer questions about programming

Guidelines:
- Be concise but thorough
- Use code examples when helpful
- Format code blocks with proper syntax highlighting using markdown
- If you're unsure about something, say so
- Focus on practical, actionable advice

${code ? `The user is currently working with the following ${language || 'code'}:\n\`\`\`${language || ''}\n${code}\n\`\`\`` : ''}`;

    // Build messages array
    const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.forEach((msg: { type: string; content: string }) => {
        messages.push({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content,
        });
      });
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      max_tokens: 2000,
      temperature: 0.7,
    });

    const assistantMessage =
      completion.choices[0]?.message?.content ||
      'Sorry, I could not generate a response.';

    res.json({
      success: true,
      message: assistantMessage,
      usage: completion.usage,
    });
  } catch (error: any) {
    console.error('AI chat error:', error);

    if (error?.status === 401) {
      return res.status(500).json({
        error: 'AI service not configured. Please set OPENAI_API_KEY.',
      });
    }

    if (error?.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please try again later.',
      });
    }

    res.status(500).json({
      error: 'Failed to get AI response',
      details: error.message,
    });
  }
});

// POST /api/ai/explain - Explain selected code
router.post(
  '/explain',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { code, language } = req.body;

      if (!code) {
        return res.status(400).json({ error: 'Code is required' });
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert code explainer. Explain the provided code clearly and concisely. Break down complex logic into understandable parts. Use bullet points for clarity.',
          },
          {
            role: 'user',
            content: `Please explain this ${language || 'code'}:\n\`\`\`${language || ''}\n${code}\n\`\`\``,
          },
        ],
        max_tokens: 1500,
        temperature: 0.5,
      });

      res.json({
        success: true,
        explanation:
          completion.choices[0]?.message?.content ||
          'Could not explain the code.',
      });
    } catch (error: any) {
      console.error('AI explain error:', error);
      res.status(500).json({ error: 'Failed to explain code' });
    }
  },
);

// POST /api/ai/fix - Find and fix issues in code
router.post('/fix', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { code, language, errorMessage } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const prompt = errorMessage
      ? `Fix this ${language || 'code'} that has the following error: "${errorMessage}"\n\`\`\`${language || ''}\n${code}\n\`\`\``
      : `Find and fix any bugs or issues in this ${language || 'code'}:\n\`\`\`${language || ''}\n${code}\n\`\`\``;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert debugger. Find bugs, issues, and potential problems in code. Provide the fixed code along with an explanation of what was wrong.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    res.json({
      success: true,
      fix:
        completion.choices[0]?.message?.content ||
        'Could not analyze the code.',
    });
  } catch (error: any) {
    console.error('AI fix error:', error);
    res.status(500).json({ error: 'Failed to fix code' });
  }
});

// POST /api/ai/improve - Suggest improvements for code
router.post(
  '/improve',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { code, language } = req.body;

      if (!code) {
        return res.status(400).json({ error: 'Code is required' });
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert code reviewer. Suggest improvements for code quality, performance, readability, and best practices. Provide specific, actionable suggestions with examples.',
          },
          {
            role: 'user',
            content: `Suggest improvements for this ${language || 'code'}:\n\`\`\`${language || ''}\n${code}\n\`\`\``,
          },
        ],
        max_tokens: 2000,
        temperature: 0.5,
      });

      res.json({
        success: true,
        improvements:
          completion.choices[0]?.message?.content ||
          'Could not analyze the code.',
      });
    } catch (error: any) {
      console.error('AI improve error:', error);
      res.status(500).json({ error: 'Failed to suggest improvements' });
    }
  },
);

// POST /api/ai/document - Add documentation to code
router.post(
  '/document',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { code, language } = req.body;

      if (!code) {
        return res.status(400).json({ error: 'Code is required' });
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert technical writer. Add comprehensive documentation to code including JSDoc/docstrings, inline comments for complex logic, and type annotations where applicable. Return the fully documented code.',
          },
          {
            role: 'user',
            content: `Add documentation to this ${language || 'code'}:\n\`\`\`${language || ''}\n${code}\n\`\`\``,
          },
        ],
        max_tokens: 3000,
        temperature: 0.3,
      });

      res.json({
        success: true,
        documentedCode:
          completion.choices[0]?.message?.content ||
          'Could not document the code.',
      });
    } catch (error: any) {
      console.error('AI document error:', error);
      res.status(500).json({ error: 'Failed to document code' });
    }
  },
);

export default router;
