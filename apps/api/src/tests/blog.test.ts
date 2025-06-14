import request from 'supertest';
import express from 'express';
import blogRoutes from '../routes/blog.routes';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.middleware';

// Mock dependencies
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    post: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    tag: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback()),
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

// Mock auth middleware
jest.mock('../middleware/auth.middleware', () => ({
  verifyToken: jest.fn((req, res, next) => {
    req.user = { sub: 'test-user-id' };
    next();
  }),
}));

// Mock cloudinary upload
jest.mock('../utils/cloudinary.util', () => ({
  uploadToCloudinary: jest.fn(() => Promise.resolve({ 
    secure_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    public_id: 'devovia/blog-images/test-user-id/sample',
  })),
}));

// Mock multer middleware
jest.mock('../middleware/multer.middleware', () => ({
  upload: {
    single: () => (req, res, next) => {
      req.file = {
        path: '/tmp/test-image.jpg',
        mimetype: 'image/jpeg',
        originalname: 'test-image.jpg',
      };
      next();
    },
  },
  cleanupTempFile: jest.fn(),
}));

describe('Blog API', () => {
  let app: express.Application;
  let prisma: any;
  
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/blogs', blogRoutes);
    prisma = new PrismaClient();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/blogs', () => {
    it('should return published blog posts', async () => {
      prisma.post.findMany.mockResolvedValue([
        {
          id: '1',
          title: 'Test Post',
          slug: 'test-post',
          content: 'Test content',
          published: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'test-user-id',
        },
      ]);
      
      prisma.post.count.mockResolvedValue(1);

      const response = await request(app).get('/api/blogs');
      expect(response.status).toBe(200);
      expect(response.body.posts).toHaveLength(1);
      expect(response.body.pagination).toBeDefined();
    });
  });

  describe('POST /api/blogs', () => {
    it('should create a new blog post', async () => {
      const testPost = {
        id: '1',
        title: 'Test Post',
        slug: 'test-post',
        content: 'Test content',
        excerpt: 'Test excerpt',
        coverImage: null,
        published: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'test-user-id',
      };
      
      prisma.post.findUnique.mockResolvedValue(null); // No duplicate slug
      prisma.post.create.mockResolvedValue(testPost);
      
      const postData = {
        title: 'Test Post',
        slug: 'test-post',
        content: 'Test content',
        tags: ['test', 'api'],
      };

      const response = await request(app)
        .post('/api/blogs')
        .send(postData);
        
      expect(response.status).toBe(201);
      expect(response.body.post).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/blogs')
        .send({ title: 'Test' }); // Missing required fields
        
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation failed');
    });
  });
  
  describe('POST /api/blogs/upload-image', () => {
    it('should upload an image to Cloudinary', async () => {
      const response = await request(app)
        .post('/api/blogs/upload-image')
        .attach('image', Buffer.from('fake-image'), 'test.jpg');
        
      expect(response.status).toBe(200);
      expect(response.body.imageUrl).toBeDefined();
      expect(response.body.success).toBe(true);
    });
  });
});
