import type { Config } from "tailwindcss";
import sharedConfig from "@repo/tailwind-config";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Pick<Config, "prefix" | "presets" | "content" | "plugins"> = {
  content: ["./src/**/*.tsx"],
  prefix: "ui-",
  presets: [sharedConfig],
  plugins: [require("tailwindcss-animate")],
};

export default config;
