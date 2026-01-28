/**
 * @openapi
 * /api/projects:
 *   get:
 *     tags:
 *       - Projects
 *     summary: Get all projects
 *     description: Retrieve a paginated list of projects with filtering and sorting
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *           maximum: 50
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PLANNING, IN_PROGRESS, COMPLETED, ON_HOLD, all]
 *         description: Filter by project status
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           enum: [PUBLIC, PRIVATE, TEAM_ONLY, all]
 *         description: Filter by visibility
 *       - in: query
 *         name: techStack
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by technology stack
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, title]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: myProjects
 *         schema:
 *           type: boolean
 *         description: Show only user's own projects
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *   post:
 *     tags:
 *       - Projects
 *     summary: Create a new project
 *     description: Create a new project (requires authentication)
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
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 example: My Awesome Project
 *               description:
 *                 type: string
 *                 example: A revolutionary web application
 *               repoUrl:
 *                 type: string
 *                 example: https://github.com/user/repo
 *               demoUrl:
 *                 type: string
 *                 example: https://demo.example.com
 *               thumbnail:
 *                 type: string
 *               techStack:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [React, Node.js, PostgreSQL]
 *               status:
 *                 type: string
 *                 enum: [PLANNING, IN_PROGRESS, COMPLETED, ON_HOLD]
 *                 default: PLANNING
 *               visibility:
 *                 type: string
 *                 enum: [PUBLIC, PRIVATE, TEAM_ONLY]
 *                 default: PUBLIC
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Validation error
 *
 * /api/projects/{id}:
 *   get:
 *     tags:
 *       - Projects
 *     summary: Get project by ID
 *     description: Retrieve a single project by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       404:
 *         description: Project not found
 *       403:
 *         description: Access denied
 *   put:
 *     tags:
 *       - Projects
 *     summary: Update project
 *     description: Update an existing project (owner only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               repoUrl:
 *                 type: string
 *               demoUrl:
 *                 type: string
 *               techStack:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [PLANNING, IN_PROGRESS, COMPLETED, ON_HOLD]
 *               visibility:
 *                 type: string
 *                 enum: [PUBLIC, PRIVATE, TEAM_ONLY]
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Project not found
 *   delete:
 *     tags:
 *       - Projects
 *     summary: Delete project
 *     description: Delete a project (owner only)
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
 *         description: Project deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Project not found
 */
