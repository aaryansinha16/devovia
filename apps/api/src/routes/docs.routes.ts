import { Router } from 'express';
import { apiReference } from '@scalar/express-api-reference';
import { swaggerSpec } from '../config/swagger.config';

const router = Router();

/**
 * @openapi
 * /api/docs:
 *   get:
 *     summary: API Documentation
 *     description: Interactive API documentation powered by Scalar
 *     tags:
 *       - Documentation
 *     responses:
 *       200:
 *         description: HTML page with API documentation
 */
router.get(
  '/',
  apiReference({
    spec: {
      content: swaggerSpec,
    },
    theme: 'purple',
    layout: 'modern',
    defaultHttpClient: {
      targetKey: 'javascript',
      clientKey: 'fetch',
    },
    authentication: {
      preferredSecurityScheme: 'bearerAuth',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
      {
        url: 'https://api.devovia.com',
        description: 'Production server',
      },
    ],
  }),
);

// Also provide JSON spec endpoint
router.get('/spec', (req, res) => {
  res.json(swaggerSpec);
});

export default router;
