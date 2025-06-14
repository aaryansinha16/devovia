import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

/**
 * Middleware factory that creates a validator middleware for request validation
 * @param schema The zod schema to validate against
 * @param source The request property to validate (body, query, params)
 * @returns Express middleware function
 */
export const validate = (schema: AnyZodObject, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      const validationResult = schema.safeParse(data);
      
      if (!validationResult.success) {
        return res.status(400).json({
          message: 'Validation error',
          errors: validationResult.error.errors,
        });
      }
      
      // Replace the request data with the validated data
      req[source] = validationResult.data;
      return next();
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error during validation' });
    }
  };
};
