/**
 * AI Controller
 * Handles business logic for AI-powered code assistance
 */

import { Request, Response } from 'express';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Chat with AI assistant
 */
export async function chatWithAI(req: Request, res: Response) {
  try {
    const { message, code, language, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

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

    const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.forEach((msg: { type: string; content: string }) => {
        messages.push({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content,
        });
      });
    }

    messages.push({ role: 'user', content: message });

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
}

/**
 * Explain selected code
 */
export async function explainCode(req: Request, res: Response) {
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
}

/**
 * Find and fix issues in code
 */
export async function fixCode(req: Request, res: Response) {
  try {
    const { code, language, errorMessage } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const userPrompt = errorMessage
      ? `This code has an error: "${errorMessage}"\n\nPlease fix it:\n\`\`\`${language || ''}\n${code}\n\`\`\``
      : `Please find and fix any issues in this code:\n\`\`\`${language || ''}\n${code}\n\`\`\``;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert debugger. Identify issues in code and provide fixed versions. Explain what was wrong and how you fixed it.',
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    res.json({
      success: true,
      fix: completion.choices[0]?.message?.content || 'Could not fix the code.',
    });
  } catch (error: any) {
    console.error('AI fix error:', error);
    res.status(500).json({ error: 'Failed to fix code' });
  }
}

/**
 * Optimize code
 */
export async function optimizeCode(req: Request, res: Response) {
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
            'You are an expert code optimizer. Suggest performance improvements and best practices. Provide optimized code with explanations.',
        },
        {
          role: 'user',
          content: `Please optimize this ${language || 'code'}:\n\`\`\`${language || ''}\n${code}\n\`\`\``,
        },
      ],
      max_tokens: 2000,
      temperature: 0.5,
    });

    res.json({
      success: true,
      optimization:
        completion.choices[0]?.message?.content ||
        'Could not optimize the code.',
    });
  } catch (error: any) {
    console.error('AI optimize error:', error);
    res.status(500).json({ error: 'Failed to optimize code' });
  }
}

/**
 * Generate code documentation
 */
export async function documentCode(req: Request, res: Response) {
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
            'You are an expert technical writer. Add clear, comprehensive documentation to code. Include function descriptions, parameter explanations, and usage examples.',
        },
        {
          role: 'user',
          content: `Please add documentation to this ${language || 'code'}:\n\`\`\`${language || ''}\n${code}\n\`\`\``,
        },
      ],
      max_tokens: 2000,
      temperature: 0.5,
    });

    res.json({
      success: true,
      documentation:
        completion.choices[0]?.message?.content ||
        'Could not generate documentation.',
    });
  } catch (error: any) {
    console.error('AI document error:', error);
    res.status(500).json({ error: 'Failed to generate documentation' });
  }
}
