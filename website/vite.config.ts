import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

export default defineConfig({
  root: "website",
  plugins: [tailwindcss()],
  base: "./",
  build: { outDir: "../website-dist", emptyOutDir: true },
})
