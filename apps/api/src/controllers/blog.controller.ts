import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { cleanupTempFile } from '../middleware/multer.middleware';
import { uploadToCloudinary } from '../utils/cloudinary.util';
import { createBlogSchema, updateBlogSchema } from '../validators/blog.validator';

const prisma = new PrismaClient();

/**
 * Get all published blog posts
 * Public endpoint that returns only published posts, sorted by most recent first
 */
export const getAllBlogPosts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const tag = req.query.tag as string;

    // Build the where clause based on query params
    const where: any = {
      published: true,
    };

    // Filter by tag if provided
    if (tag) {
      where.tags = {
        some: {
          name: {
            equals: tag,
            mode: 'insensitive',
          },
        },
      };
    }

    // Get total count for pagination
    const totalCount = await prisma.post.count({ where });

    // Get posts with author and tags
    const posts = await prisma.post.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        published: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        tags: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    // Format tags array to be just an array of strings
    const formattedPosts = posts.map((post) => ({
      ...post,
      tags: post.tags.map((tag) => tag.name),
    }));

    return res.status(200).json({
      posts: formattedPosts,
      pagination: {
        total: totalCount,
        page,
        pages: Math.ceil(totalCount / limit),
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get a specific blog post by its slug
 * Public endpoint that returns a post with its complete content
 */
/**
 * Utility endpoint for debugging - list all blog IDs in the database
 */
export const listAllBlogIds = async (req: Request, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        title: true
      }
    });
    
    return res.status(200).json({ posts });
  } catch (error) {
    console.error('Error listing blog IDs:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getBlogPostById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('Looking for blog post with ID:', id);
    
    // Try to find post with raw query for better debugging - use properly quoted table name for PostgreSQL
    try {
      const rawPost = await prisma.$queryRaw`SELECT id FROM "Post" WHERE id = ${id}`;
      console.log('Raw query result:', JSON.stringify(rawPost, null, 2));
    } catch (rawQueryError) {
      console.error('Raw query error:', rawQueryError);
    }
    
    // Try to find the post with a more direct query method
    try {
      const post = await prisma.post.findMany({
        where: {
          id: {
            equals: id,
            mode: 'insensitive', // Try case-insensitive match
          },
        },
        take: 1,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              bio: true,
            },
          },
          tags: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
          comments: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });
      
      if (!post || post.length === 0) {
        console.log('No post found in findMany with ID:', id);
        // Let's try to find the first few posts to debug
        const samplePosts = await prisma.post.findMany({
          take: 3,
          select: { id: true, title: true }
        });
        console.log('Sample posts in database:', JSON.stringify(samplePosts, null, 2));
        return res.status(404).json({ message: 'Blog post not found' });
      }
      
      const foundPost = post[0];
      console.log('Successfully found post with findMany:', foundPost.id);
      
      // Format tags to be just an array of strings
      const formattedPost = {
        ...foundPost,
        tags: foundPost.tags.map((tag) => tag.name),
      };
      
      return res.status(200).json({ post: formattedPost });
      
    } catch (findManyError) {
      console.error('Error in findMany query:', findManyError);
      return res.status(500).json({ message: 'Error finding blog post' });
    }
  } catch (error) {
    console.error('Error fetching blog post by ID:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getBlogPostBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            bio: true,
          },
        },
        tags: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
        comments: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // Check if it's published or if the current user is the author
    if (!post.published) {
      const userId = req.user?.sub;

      // If not published and not the author, return 404
      if (post.userId !== userId) {
        return res.status(404).json({ message: 'Blog post not found' });
      }
    }

    // Format tags to be just an array of strings
    const formattedPost = {
      ...post,
      tags: post.tags.map((tag) => tag.name),
    };

    return res.status(200).json({ post: formattedPost });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get all blog posts for the current authenticated user
 * Includes both published and draft posts
 */
export const getUserBlogPosts = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const posts = await prisma.post.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        published: true,
        createdAt: true,
        updatedAt: true,
        tags: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    // Format tags to be just an array of strings
    const formattedPosts = posts.map((post) => ({
      ...post,
      tags: post.tags.map((tag) => tag.name),
    }));

    return res.status(200).json({ posts: formattedPosts });
  } catch (error) {
    console.error('Error fetching user blog posts:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new blog post
 */
export const createBlogPost = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Validate request body against schema
    const validationResult = createBlogSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationResult.error.errors
      });
    }
    
    const { title, slug, content, excerpt, coverImage, published, tags } = validationResult.data;

    // Check for slug uniqueness
    const existingPost = await prisma.post.findUnique({
      where: { slug },
    });

    if (existingPost) {
      return res.status(400).json({
        message: 'Slug already exists. Please choose a different slug.',
      });
    }

    // Start a transaction to handle tags and post creation
    const post = await prisma.$transaction(async (prisma) => {
      // Create or connect existing tags
      const tagObjects = [];
      if (tags && Array.isArray(tags)) {
        for (const tagName of tags) {
          const tag = await prisma.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName },
          });
          tagObjects.push({ name: tag.name });
        }
      }

      // Create the post
      return prisma.post.create({
        data: {
          title,
          slug,
          content,
          excerpt,
          coverImage,
          published: published || false,
          userId,
          tags: {
            connect: tagObjects.map(tag => ({ name: tag.name })),
          },
        },
        include: {
          tags: {
            select: {
              name: true,
            },
          },
        },
      });
    });

    // Format tags to be just an array of strings
    const formattedPost = {
      ...post,
      tags: post.tags.map((tag) => tag.name),
    };

    return res.status(201).json({ post: formattedPost });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update an existing blog post
 */
export const updateBlogPost = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Validate request body against schema
    const validationResult = updateBlogSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationResult.error.errors
      });
    }
    
    const { title, slug, content, excerpt, coverImage, published, tags } = validationResult.data;

    // Check if the post exists and belongs to the user
    const existingPost = await prisma.post.findUnique({
      where: { id },
      include: {
        tags: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!existingPost) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    if (existingPost.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden: You can only update your own posts' });
    }

    // Check slug uniqueness if slug is updated
    if (slug && slug !== existingPost.slug) {
      const slugExists = await prisma.post.findUnique({
        where: { slug },
      });

      if (slugExists) {
        return res.status(400).json({
          message: 'Slug already exists. Please choose a different slug.',
        });
      }
    }

    // Update the post in a transaction to handle tags properly
    const updatedPost = await prisma.$transaction(async (prisma) => {
      // First, disconnect all existing tags
      await prisma.post.update({
        where: { id },
        data: {
          tags: {
            disconnect: existingPost.tags.map(tag => ({ name: tag.name })),
          },
        },
      });

      // Then create or connect new tags
      const tagObjects = [];
      if (tags && Array.isArray(tags)) {
        for (const tagName of tags) {
          const tag = await prisma.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName },
          });
          tagObjects.push({ name: tag.name });
        }
      }

      // Update the post with new data
      return prisma.post.update({
        where: { id },
        data: {
          title,
          slug,
          content,
          excerpt,
          coverImage,
          published,
          updatedAt: new Date(),
          tags: {
            connect: tagObjects.map(tag => ({ name: tag.name })),
          },
        },
        include: {
          tags: {
            select: {
              name: true,
            },
          },
        },
      });
    });

    // Format tags to be just an array of strings
    const formattedPost = {
      ...updatedPost,
      tags: updatedPost.tags.map((tag) => tag.name),
    };

    return res.status(200).json({ post: formattedPost });
  } catch (error) {
    console.error('Error updating blog post:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete a blog post
 */
export const deleteBlogPost = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if the post exists and belongs to the user
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own posts' });
    }

    // Delete the post
    await prisma.post.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Upload an image for a blog post
 * This is used for image uploads within the rich text editor
 */
export const uploadBlogImage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    // Upload the file to Cloudinary
    try {
      // Get the temporary file path
      const filePath = req.file.path;

      // Upload to Cloudinary in blog-images folder
      const uploadResult = await uploadToCloudinary(filePath, `devovia/blog-images/${userId}`);

      // Clean up the temporary file
      cleanupTempFile(filePath);

      // Return the secure URL and other image details
      return res.status(200).json({
        success: true,
        imageUrl: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
      });
    } catch (cloudinaryError) {
      console.error('Cloudinary upload error:', cloudinaryError);
      return res
        .status(500)
        .json({ message: 'Failed to upload image to cloud storage' });
    }
  } catch (error) {
    console.error('Error uploading blog image:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
