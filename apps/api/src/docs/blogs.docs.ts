/**
 * @openapi
 * /api/blogs:
 *   get:
 *     tags:
 *       - Blogs
 *     summary: Get all published blog posts
 *     description: Retrieve a paginated list of published blog posts with filtering and sorting
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *           maximum: 50
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, excerpt, and content
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by tag name
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, title]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Blog posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       slug:
 *                         type: string
 *                       excerpt:
 *                         type: string
 *                       coverImage:
 *                         type: string
 *                       published:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       author:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           username:
 *                             type: string
 *                           avatar:
 *                             type: string
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       500:
 *         description: Internal server error
 *   post:
 *     tags:
 *       - Blogs
 *     summary: Create a blog post
 *     description: Create a new blog post (requires authentication)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 example: Getting Started with React Hooks
 *               content:
 *                 type: string
 *                 example: React Hooks revolutionized...
 *               excerpt:
 *                 type: string
 *                 example: Learn the basics of React Hooks
 *               coverImage:
 *                 type: string
 *               published:
 *                 type: boolean
 *                 default: false
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [react, hooks, javascript]
 *     responses:
 *       201:
 *         description: Blog post created successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Validation error
 *
 * /api/blogs/{slug}:
 *   get:
 *     tags:
 *       - Blogs
 *     summary: Get blog post by slug
 *     description: Retrieve a single blog post by its slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post slug
 *     responses:
 *       200:
 *         description: Blog post retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     content:
 *                       type: string
 *                     excerpt:
 *                       type: string
 *                     coverImage:
 *                       type: string
 *                     published:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     author:
 *                       type: object
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: object
 *       404:
 *         description: Blog post not found
 *   put:
 *     tags:
 *       - Blogs
 *     summary: Update blog post
 *     description: Update an existing blog post (author only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               coverImage:
 *                 type: string
 *               published:
 *                 type: boolean
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Blog post updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Blog post not found
 *   delete:
 *     tags:
 *       - Blogs
 *     summary: Delete blog post
 *     description: Delete a blog post (author only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog post deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Blog post not found
 */
