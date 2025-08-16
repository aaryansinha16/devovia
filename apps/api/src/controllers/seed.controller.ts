import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';

const prisma = new PrismaClient();

/**
 * Seed the database with test data for blog posts, comments, and likes
 */
export const seedTestData = async (req: Request, res: Response) => {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return res
        .status(403)
        .json({ error: 'Seed endpoint is not available in production' });
    }

    // Get the admin user or create one if none exists
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminUser) {
      return res
        .status(404)
        .json({ error: 'No admin user found to assign blog posts to' });
    }

    // Create test blog posts
    const blogPosts = [];
    for (let i = 1; i <= 5; i++) {
      const title = `Test Blog Post ${i}`;
      const slug = slugify(title, { lower: true });

      const post = await prisma.post.create({
        data: {
          title,
          slug,
          content: JSON.stringify({
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: `This is a test blog post ${i} with some content. This post was auto-generated for testing.`,
                  },
                ],
              },
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget aliquam ultricies, nunc nunc ultricies nunc, vitae ultricies nisl nunc eget nisl.',
                  },
                ],
              },
            ],
          }),
          excerpt: `This is a short excerpt for test blog post ${i}. Click to read more.`,
          coverImage: `https://picsum.photos/seed/blog${i}/800/400`,
          published: true,
          userId: adminUser.id,
          tags: {
            create: [{ name: 'test' }, { name: `tag${i}` }, { name: 'sample' }],
          },
        },
      });

      blogPosts.push(post);

      // Add some comments to each post
      for (let j = 1; j <= 3; j++) {
        await prisma.comment.create({
          data: {
            content: `This is test comment ${j} on blog post ${i}.`,
            userId: adminUser.id,
            postId: post.id,
          },
        });
      }

      // Add a like from the admin user
      await prisma.like.create({
        data: {
          userId: adminUser.id,
          postId: post.id,
        },
      });
    }

    return res.status(200).json({
      message: 'Test data seeded successfully',
      blogs: blogPosts.length,
      comments: blogPosts.length * 3,
      likes: blogPosts.length,
    });
  } catch (error) {
    console.error('Error seeding test data:', error);
    return res.status(500).json({ error: 'Failed to seed test data' });
  }
};
