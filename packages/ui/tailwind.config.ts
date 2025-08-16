import type { Config } from "tailwindcss";
import sharedConfig from "@repo/tailwind-config";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Pick<Config, "presets" | "content" | "plugins"> = {
  content: ["./src/**/*.tsx"],
  presets: [sharedConfig],
  plugins: [require("tailwindcss-animate")],
};

export default config;
