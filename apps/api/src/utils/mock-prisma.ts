/**
 * Mock Prisma Client
 *
 * This file provides a mock implementation of the Prisma client for development
 * and testing purposes while we resolve the Prisma initialization issues in the monorepo.
 */

// Mock user data
const users = [
  {
    id: '1',
    email: 'user@example.com',
    username: 'testuser',
    password: '$2b$10$6KVtC0kFcCPGD8KKSRlUBOG4XUZ0jF4MgNt2/jT4HJgC.UWc0W5oe', // hashed 'password123'
    name: 'Test User',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
];

// Mock session data
const sessions = [
  {
    id: '1',
    userId: '1',
    refreshToken: 'mock-refresh-token',
    userAgent: 'Mock User Agent',
    ipAddress: '127.0.0.1',
    isActive: true,
    expiresAt: new Date('2025-12-31'),
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    lastUsedAt: new Date('2025-01-01'),
  },
];

// Mock Prisma client
export const mockPrisma = {
  user: {
    findFirst: async (params: any) => {
      if (!params.where) return null;

      const { OR, email, username, id } = params.where;

      if (OR) {
        const conditions = OR.map((condition: any) => {
          const key = Object.keys(condition)[0];
          const value = condition[key];
          return users.find((user) => user[key] === value);
        });

        return conditions.find(Boolean) || null;
      }

      if (email) {
        return users.find((user) => user.email === email) || null;
      }

      if (username) {
        return users.find((user) => user.username === username) || null;
      }

      if (id) {
        return users.find((user) => user.id === id) || null;
      }

      return null;
    },
    create: async (params: any) => {
      const newUser = {
        id: String(users.length + 1),
        ...params.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      users.push(newUser);
      return newUser;
    },
  },
  session: {
    create: async (params: any) => {
      const newSession = {
        id: String(sessions.length + 1),
        ...params.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      sessions.push(newSession);
      return newSession;
    },
    findUnique: async (params: any) => {
      if (!params.where) return null;

      const { id, refreshToken } = params.where;

      if (id) {
        return sessions.find((session) => session.id === id) || null;
      }

      if (refreshToken) {
        return (
          sessions.find((session) => session.refreshToken === refreshToken) ||
          null
        );
      }

      return null;
    },
    findMany: async (params: any) => {
      if (!params.where) return [];

      const { userId, isActive, expiresAt } = params.where;

      let filteredSessions = [...sessions];

      if (userId) {
        filteredSessions = filteredSessions.filter(
          (session) => session.userId === userId,
        );
      }

      if (isActive !== undefined) {
        filteredSessions = filteredSessions.filter(
          (session) => session.isActive === isActive,
        );
      }

      if (expiresAt && expiresAt.gt) {
        const compareDate = expiresAt.gt;
        filteredSessions = filteredSessions.filter(
          (session) => session.expiresAt > compareDate,
        );
      }

      if (params.orderBy && params.orderBy.lastUsedAt === 'desc') {
        filteredSessions.sort(
          (a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime(),
        );
      }

      if (params.select) {
        return filteredSessions.map((session) => {
          const result: any = {};
          for (const key in params.select) {
            if (params.select[key]) {
              result[key] = session[key];
            }
          }
          return result;
        });
      }

      return filteredSessions;
    },
    update: async (params: any) => {
      if (!params.where) return null;

      const { id } = params.where;
      const sessionIndex = sessions.findIndex((session) => session.id === id);

      if (sessionIndex === -1) return null;

      const updatedSession = {
        ...sessions[sessionIndex],
        ...params.data,
        updatedAt: new Date(),
      };

      sessions[sessionIndex] = updatedSession;
      return updatedSession;
    },
    updateMany: async (params: any) => {
      if (!params.where) return { count: 0 };

      const { userId, refreshToken } = params.where;
      let count = 0;

      sessions.forEach((session, index) => {
        let shouldUpdate = false;

        if (userId && session.userId === userId) {
          shouldUpdate = true;
        }

        if (refreshToken && session.refreshToken === refreshToken) {
          shouldUpdate = true;
        }

        if (shouldUpdate) {
          sessions[index] = {
            ...session,
            ...params.data,
            updatedAt: new Date(),
          };
          count++;
        }
      });

      return { count };
    },
  },
  $connect: async () => {
    console.log('Mock Prisma client connected');
    return Promise.resolve();
  },
  $disconnect: async () => {
    console.log('Mock Prisma client disconnected');
    return Promise.resolve();
  },
};
