/**
 * @openapi
 * /api/blogs/{postId}/like:
 *   post:
 *     tags:
 *       - Likes
 *     summary: Like a blog post
 *     description: Add a like to a blog post (requires authentication)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post ID
 *     responses:
 *       201:
 *         description: Blog post liked successfully
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
 *                     like:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         userId:
 *                           type: string
 *                         postId:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                     likeCount:
 *                       type: integer
 *                       example: 42
 *       400:
 *         description: Already liked this post
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Blog post not found
 *   delete:
 *     tags:
 *       - Likes
 *     summary: Unlike a blog post
 *     description: Remove a like from a blog post (requires authentication)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post ID
 *     responses:
 *       200:
 *         description: Blog post unliked successfully
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
 *                     likeCount:
 *                       type: integer
 *                       example: 41
 *       404:
 *         description: Blog post not found or like not found
 *       401:
 *         description: Unauthorized
 *
 * /api/blogs/{postId}/likes:
 *   get:
 *     tags:
 *       - Likes
 *     summary: Get likes for a blog post
 *     description: Retrieve all users who liked a specific blog post
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post ID
 *     responses:
 *       200:
 *         description: Likes retrieved successfully
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
 *                     likes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               username:
 *                                 type: string
 *                               avatar:
 *                                 type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     likeCount:
 *                       type: integer
 *       404:
 *         description: Blog post not found
 */
