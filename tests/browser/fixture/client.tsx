import { createRoot, hydrateRoot } from "react-dom/client"
import "leaflet/dist/leaflet.css"
import "releaf/styles.css"
import "./styles.css"
import { LocationPicker } from "../../../stories/examples/LocationPicker"
import { App } from "./app"

const host = document.getElementById("root")!
if (location.pathname === "/hydrate") hydrateRoot(host, <App />)
else
  createRoot(host).render(
    new URLSearchParams(location.search).has("picker") ? (
      <LocationPicker tileUrl="/tiles/{z}/{x}/{y}.svg" />
    ) : (
      <App />
    ),
  )
