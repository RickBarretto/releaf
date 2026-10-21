import tailwindcss from "@tailwindcss/vite"
import { build } from "vite"

await build({
  configFile: false,
  plugins: [tailwindcss()],
  build: {
    emptyOutDir: false,
    outDir: "dist",
    rollupOptions: {
      input: "src/styles.css",
      output: { assetFileNames: "styles.css" },
    },
  },
})
