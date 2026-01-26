/**
 * @openapi
 * /api/snippets:
 *   get:
 *     tags:
 *       - Snippets
 *     summary: Get all snippets
 *     description: Retrieve user's code snippets with filtering and pagination
 *     security:
 *       - bearerAuth: []
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
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Filter by programming language
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by tag
 *     responses:
 *       200:
 *         description: Snippets retrieved successfully
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
 *                     $ref: '#/components/schemas/Snippet'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized
 *   post:
 *     tags:
 *       - Snippets
 *     summary: Create a snippet
 *     description: Create a new code snippet
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
 *               - code
 *               - language
 *             properties:
 *               title:
 *                 type: string
 *                 example: React Custom Hook
 *               description:
 *                 type: string
 *               code:
 *                 type: string
 *                 example: const useCustomHook = () => { ... }
 *               language:
 *                 type: string
 *                 example: typescript
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [react, hooks]
 *               isPublic:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Snippet created successfully
 *       401:
 *         description: Unauthorized
 *
 * /api/snippets/{id}:
 *   get:
 *     tags:
 *       - Snippets
 *     summary: Get snippet by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Snippet retrieved
 *       404:
 *         description: Snippet not found
 *   put:
 *     tags:
 *       - Snippets
 *     summary: Update snippet
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               code:
 *                 type: string
 *               language:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Snippet updated
 *       404:
 *         description: Snippet not found
 *   delete:
 *     tags:
 *       - Snippets
 *     summary: Delete snippet
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Snippet deleted
 *       404:
 *         description: Snippet not found
 */
