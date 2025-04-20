import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: {
    resolve: true,
  },
  clean: true,
  // Skip type checking to avoid issues with Prisma's generated types
  // We'll rely on the TypeScript compiler for type checking
  skipNodeModulesBundle: true,
  noExternal: ["@prisma/client"],
  sourcemap: true,
});
