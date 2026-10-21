import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.tsx"],
  addons: [fileURLToPath(new URL("./docs-preset.ts", import.meta.url))],
  framework: "@storybook/react-vite",
  core: { disableTelemetry: true },
  viteFinal: (config) =>
    mergeConfig(config, {
      plugins: [tailwindcss()],
      resolve: {
        alias: {
          "@": fileURLToPath(new URL("../stories", import.meta.url)),
          "releaf/events": fileURLToPath(
            new URL("../src/events.ts", import.meta.url),
          ),
          releaf: fileURLToPath(new URL("../src/index.ts", import.meta.url)),
        },
        dedupe: ["react", "react-dom", "leaflet"],
      },
    }),
};
export default config;
