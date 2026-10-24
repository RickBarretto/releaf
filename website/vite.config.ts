import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

export default defineConfig({
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
