/**
 * @openapi
 * /api/runbooks:
 *   get:
 *     tags:
 *       - Runbooks
 *     summary: Get all runbooks
 *     description: Retrieve user's runbooks with filtering and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, ACTIVE, ARCHIVED]
 *         description: Filter by runbook status
 *       - in: query
 *         name: environment
 *         schema:
 *           type: string
 *           enum: [DEVELOPMENT, STAGING, PRODUCTION]
 *         description: Filter by environment
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by tags
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name and description
 *     responses:
 *       200:
 *         description: Runbooks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 runbooks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [DRAFT, ACTIVE, ARCHIVED]
 *                       environment:
 *                         type: string
 *                         enum: [DEVELOPMENT, STAGING, PRODUCTION]
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                       steps:
 *                         type: array
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       _count:
 *                         type: object
 *                         properties:
 *                           executions:
 *                             type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *   post:
 *     tags:
 *       - Runbooks
 *     summary: Create a runbook
 *     description: Create a new automation runbook
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - steps
 *             properties:
 *               name:
 *                 type: string
 *                 example: Deploy to Production
 *               description:
 *                 type: string
 *                 example: Automated deployment workflow
 *               environment:
 *                 type: string
 *                 enum: [DEVELOPMENT, STAGING, PRODUCTION]
 *                 default: DEVELOPMENT
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [deployment, automation]
 *               steps:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [COMMAND, API_CALL, APPROVAL, NOTIFICATION]
 *                     command:
 *                       type: string
 *                     timeout:
 *                       type: integer
 *               parameters:
 *                 type: object
 *               variables:
 *                 type: object
 *               timeoutSeconds:
 *                 type: integer
 *                 default: 3600
 *     responses:
 *       201:
 *         description: Runbook created successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Validation error
 *
 * /api/runbooks/{id}:
 *   get:
 *     tags:
 *       - Runbooks
 *     summary: Get runbook by ID
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
 *         description: Runbook retrieved
 *       404:
 *         description: Runbook not found
 *       401:
 *         description: Unauthorized
 *   put:
 *     tags:
 *       - Runbooks
 *     summary: Update runbook
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [DRAFT, ACTIVE, ARCHIVED]
 *               steps:
 *                 type: array
 *     responses:
 *       200:
 *         description: Runbook updated
 *       404:
 *         description: Runbook not found
 *       401:
 *         description: Unauthorized
 *   delete:
 *     tags:
 *       - Runbooks
 *     summary: Delete runbook
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
 *         description: Runbook deleted
 *       404:
 *         description: Runbook not found
 *       401:
 *         description: Unauthorized
 *
 * /api/runbooks/{id}/execute:
 *   post:
 *     tags:
 *       - Runbooks
 *     summary: Execute a runbook
 *     description: Start execution of a runbook
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
 *               parameters:
 *                 type: object
 *                 description: Runtime parameters for execution
 *     responses:
 *       200:
 *         description: Execution started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 executionId:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [PENDING, RUNNING, SUCCESS, FAILED, CANCELLED]
 *       404:
 *         description: Runbook not found
 *       401:
 *         description: Unauthorized
 *
 * /api/runbooks/{id}/executions:
 *   get:
 *     tags:
 *       - Runbooks
 *     summary: Get runbook execution history
 *     description: Retrieve execution history for a specific runbook
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Execution history retrieved
 *       404:
 *         description: Runbook not found
 *       401:
 *         description: Unauthorized
 */
