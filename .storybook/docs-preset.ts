import { fileURLToPath } from "node:url";

export * from "@storybook/addon-docs/preset";

// Keep the manager entry outside dependency-store paths: encoded '+' characters
// in those paths cause Storybook 10.5's dev asset server to return 404.
export const managerEntries = (entries: string[] = []) => [
  ...entries,
  fileURLToPath(new URL("./docs-manager.ts", import.meta.url)),
];

export const previewAnnotations = (entries: string[] = []) => [
  ...entries,
  fileURLToPath(import.meta.resolve("@storybook/addon-docs/preview")),
];
