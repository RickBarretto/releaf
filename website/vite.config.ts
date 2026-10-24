import { execFileSync } from "node:child_process"
import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

function getWebsiteVersion(): string {
  try {
    return execFileSync("git", ["describe", "--tags", "--abbrev=0"], {
      cwd: resolve(import.meta.dirname, ".."),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()
  } catch {
    return "unreleased"
  }
}

export default defineConfig({
  define: {
    __WEBSITE_VERSION__: JSON.stringify(getWebsiteVersion()),
  },
  root: "website",
  plugins: [tailwindcss()],
  base: "./",
  build: {
    outDir: "../website-dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, "index.html"),
        api: resolve(import.meta.dirname, "api/index.html"),
      },
    },
  },
})
