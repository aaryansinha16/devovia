// Import directly from the database package's source
import { prisma } from "@repo/database";

// Export the prisma instance for use in the web app
export const db = prisma;

// Helper function to exclude fields from a model
export function exclude<T, K extends keyof T>(model: T, keys: K[]): Omit<T, K> {
  const result = { ...model };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

// Helper function to safely exclude password from user objects
export function excludePassword<T>(
  user: T & { password: string },
): Omit<T, "password"> {
  return exclude(user, ["password"]);
}
