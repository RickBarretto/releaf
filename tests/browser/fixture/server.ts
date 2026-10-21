import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { createServer } from "vite"

const root = fileURLToPath(new URL(".", import.meta.url))
const server = await createServer({
  root,
  configFile: false,
  appType: "custom",
  server: {
    host: "127.0.0.1",
    port: Number(process.env.RELEAF_TEST_PORT ?? 4173),
    strictPort: true,
  },
  resolve: { dedupe: ["react", "react-dom", "leaflet"] },
  optimizeDeps: { exclude: ["releaf"] },
})
server.middlewares.use(async (req, res, next) => {
  if (
    [
      "/images/marker-icon.png",
      "/images/marker-icon-2x.png",
      "/images/marker-shadow.png",
    ].includes(req.url ?? "")
  ) {
    res.setHeader("Content-Type", "image/png")
    res.end(
      await readFile(
        fileURLToPath(
          new URL(
            `../../../node_modules/leaflet/dist${req.url}`,
            import.meta.url,
          ),
        ),
      ),
    )
    return
  }
  if (req.url?.startsWith("/tiles/")) {
    res.setHeader("Content-Type", "image/svg+xml")
    res.end(
      '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#dde8de"/><path d="M0 0H256V256H0Z" fill="none" stroke="#789"/><path d="M0 128H256M128 0V256" stroke="#abc"/></svg>',
    )
    return
  }
  if (req.url !== "/hydrate" && req.url?.split("?")[0] !== "/") return next()
  try {
    const { App } = await server.ssrLoadModule("/app.tsx")
    const { createElement } = await import("react")
    const { renderToString } = await import("react-dom/server")
    const html = (await readFile(`${root}/index.html`, "utf8")).replace(
      "<!--ssr-->",
      req.url === "/hydrate" ? renderToString(createElement(App)) : "",
    )
    res.setHeader("Content-Type", "text/html")
    res.end(await server.transformIndexHtml("/hydrate", html))
  } catch (error) {
    next(error)
  }
})
await server.listen()
