/**
 * @openapi
 * /api/sessions:
 *   get:
 *     tags:
 *       - Sessions
 *     summary: Get all collaboration sessions
 *     description: Retrieve user's collaboration sessions with filtering and pagination
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, ENDED]
 *         description: Filter by session status
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Filter by programming language
 *     responses:
 *       200:
 *         description: Sessions retrieved successfully
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
 *                     $ref: '#/components/schemas/Session'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized
 *   post:
 *     tags:
 *       - Sessions
 *     summary: Create a collaboration session
 *     description: Start a new real-time collaboration session
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
 *               - language
 *             properties:
 *               title:
 *                 type: string
 *                 example: Pair Programming Session
 *               description:
 *                 type: string
 *                 example: Working on React components
 *               language:
 *                 type: string
 *                 example: typescript
 *               isPublic:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Session created successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Validation error
 *
 * /api/sessions/{id}:
 *   get:
 *     tags:
 *       - Sessions
 *     summary: Get session by ID
 *     description: Retrieve details of a specific collaboration session
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
 *         description: Session retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Session'
 *       404:
 *         description: Session not found
 *       401:
 *         description: Unauthorized
 *   put:
 *     tags:
 *       - Sessions
 *     summary: Update session
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
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, ENDED]
 *     responses:
 *       200:
 *         description: Session updated
 *       404:
 *         description: Session not found
 *       401:
 *         description: Unauthorized
 *   delete:
 *     tags:
 *       - Sessions
 *     summary: Delete session
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
 *         description: Session deleted
 *       404:
 *         description: Session not found
 *       401:
 *         description: Unauthorized
 *
 * /api/sessions/{id}/join:
 *   post:
 *     tags:
 *       - Sessions
 *     summary: Join a session
 *     description: Join an active collaboration session
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
 *         description: Successfully joined session
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
 *                     sessionId:
 *                       type: string
 *                     wsUrl:
 *                       type: string
 *                       description: WebSocket URL for real-time collaboration
 *       404:
 *         description: Session not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Session is private or full
 *
 * /api/sessions/{id}/leave:
 *   post:
 *     tags:
 *       - Sessions
 *     summary: Leave a session
 *     description: Leave an active collaboration session
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
 *         description: Successfully left session
 *       404:
 *         description: Session not found
 *       401:
 *         description: Unauthorized
 */
