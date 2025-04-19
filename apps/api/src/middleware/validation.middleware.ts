import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Middleware to validate request body against a Zod schema
export const validateRequest = (schema: z.ZodType<any, any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body against schema
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format validation errors
        const errors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          message: 'Validation error',
          errors,
        });
      }

      return res.status(400).json({ message: 'Invalid request data' });
    }
  };
};
