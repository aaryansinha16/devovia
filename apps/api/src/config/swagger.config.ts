import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Devovia API Documentation',
      version: '1.0.0',
      description: `
# Devovia API

A comprehensive developer collaboration platform API with real-time features.

## Features
- 🔐 Authentication (JWT + OAuth)
- 📁 Projects & Teams Management
- 💬 Real-time Collaboration Sessions
- 📝 Code Snippets
- 📚 Runbooks & Automation
- ✍️ Blog Posts
- 💭 Comments & Likes
- 👥 User Management
- 🔧 Admin & Moderator Tools

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

Get your token by logging in via:
- POST /api/auth/login
- POST /api/auth/register
- GET /api/auth/github (OAuth)

## Response Format

All API responses follow a standardized format:

### Success Response (Single Item)
\`\`\`json
{
  "success": true,
  "data": { /* resource object */ },
  "message": "Operation successful",
  "meta": {
    "timestamp": "2026-01-26T08:20:00.000Z"
  }
}
\`\`\`

### Paginated Response
\`\`\`json
{
  "success": true,
  "data": [ /* array of resources */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "message": "Resources retrieved successfully",
  "meta": {
    "timestamp": "2026-01-26T08:20:00.000Z"
  }
}
\`\`\`

### Error Response
\`\`\`json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-01-26T08:20:00.000Z"
  }
}
\`\`\`

## Common Query Parameters

List endpoints support these query parameters:

- \`page\` (number): Page number (default: 1)
- \`limit\` (number): Items per page (default: 20, max: 100)
- \`search\` (string): Full-text search query
- \`sortBy\` (string): Field to sort by
- \`sortOrder\` (string): 'asc' or 'desc' (default: 'desc')

## Rate Limiting

API requests are rate-limited to prevent abuse. Current limits:
- Authenticated users: 1000 requests/hour
- Unauthenticated users: 100 requests/hour
      `,
      contact: {
        name: 'Devovia Support',
        url: 'https://devovia.com/support',
        email: 'support@devovia.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
      {
        url: 'https://api.devovia.com',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Projects',
        description: 'Project management and collaboration',
      },
      {
        name: 'Sessions',
        description: 'Real-time collaboration sessions',
      },
      {
        name: 'Snippets',
        description: 'Code snippet management',
      },
      {
        name: 'Runbooks',
        description: 'Automation runbooks and executions',
      },
      {
        name: 'Blogs',
        description: 'Blog post management',
      },
      {
        name: 'Users',
        description: 'User profile and management',
      },
      {
        name: 'Comments',
        description: 'Comment system for resources',
      },
      {
        name: 'Likes',
        description: 'Like/unlike resources',
      },
      {
        name: 'Admin',
        description: 'Administrative endpoints (Admin only)',
      },
      {
        name: 'Moderator',
        description: 'Moderation endpoints (Moderator only)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from login/register',
        },
      },
      schemas: {
        // Common schemas
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'NOT_FOUND',
                },
                message: {
                  type: 'string',
                  example: 'Resource not found',
                },
                details: {
                  type: 'object',
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                },
              },
            },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1,
            },
            limit: {
              type: 'integer',
              example: 20,
            },
            total: {
              type: 'integer',
              example: 100,
            },
            totalPages: {
              type: 'integer',
              example: 5,
            },
            hasNext: {
              type: 'boolean',
              example: true,
            },
            hasPrev: {
              type: 'boolean',
              example: false,
            },
          },
        },
        // User schemas
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'cm123abc456',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            username: {
              type: 'string',
              example: 'johndoe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            avatar: {
              type: 'string',
              nullable: true,
              example: 'https://example.com/avatar.jpg',
            },
            bio: {
              type: 'string',
              nullable: true,
              example: 'Full-stack developer',
            },
            role: {
              type: 'string',
              enum: ['USER', 'MODERATOR', 'ADMIN'],
              example: 'USER',
            },
            isVerified: {
              type: 'boolean',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        // Project schemas
        Project: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'cm123abc456',
            },
            title: {
              type: 'string',
              example: 'My Awesome Project',
            },
            description: {
              type: 'string',
              example: 'A revolutionary web application',
            },
            repoUrl: {
              type: 'string',
              nullable: true,
              example: 'https://github.com/user/repo',
            },
            demoUrl: {
              type: 'string',
              nullable: true,
              example: 'https://demo.example.com',
            },
            thumbnail: {
              type: 'string',
              nullable: true,
            },
            techStack: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['React', 'Node.js', 'PostgreSQL'],
            },
            status: {
              type: 'string',
              enum: ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'],
              example: 'IN_PROGRESS',
            },
            visibility: {
              type: 'string',
              enum: ['PUBLIC', 'PRIVATE', 'TEAM_ONLY'],
              example: 'PUBLIC',
            },
            userId: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        // Session schemas
        Session: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            title: {
              type: 'string',
              example: 'Pair Programming Session',
            },
            description: {
              type: 'string',
              nullable: true,
            },
            language: {
              type: 'string',
              example: 'typescript',
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'ENDED'],
              example: 'ACTIVE',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        // Snippet schemas
        Snippet: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            title: {
              type: 'string',
              example: 'React Custom Hook',
            },
            description: {
              type: 'string',
              nullable: true,
            },
            code: {
              type: 'string',
              example: 'const useCustomHook = () => { ... }',
            },
            language: {
              type: 'string',
              example: 'typescript',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['react', 'hooks'],
            },
            isPublic: {
              type: 'boolean',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/docs/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
