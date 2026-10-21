import { createRoot, hydrateRoot } from "react-dom/client"
import "leaflet/dist/leaflet.css"
import "releaf/styles.css"
import { App } from "./app"

const host = document.getElementById("root")!
if (location.pathname === "/hydrate") hydrateRoot(host, <App />)
else createRoot(host).render(<App />)
