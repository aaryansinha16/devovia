import { z } from 'zod';

// Create blog validation schema
export const createBlogSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title cannot exceed 100 characters'),
  slug: z
    .string()
    .min(5, 'Slug must be at least 5 characters')
    .max(100, 'Slug cannot exceed 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  excerpt: z.string().max(300, 'Excerpt cannot exceed 300 characters').optional(),
  coverImage: z.string().url('Cover image must be a valid URL').optional().nullable(),
  published: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional(),
});

// Update blog validation schema
export const updateBlogSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title cannot exceed 100 characters').optional(),
  slug: z
    .string()
    .min(5, 'Slug must be at least 5 characters')
    .max(100, 'Slug cannot exceed 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
  content: z.string().min(10, 'Content must be at least 10 characters').optional(),
  excerpt: z.string().max(300, 'Excerpt cannot exceed 300 characters').optional().nullable(),
  coverImage: z.string().url('Cover image must be a valid URL').optional().nullable(),
  published: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// Image upload validation schema
export const imageUploadSchema = z.object({
  image: z.any(), // This will be validated by multer middleware
});
