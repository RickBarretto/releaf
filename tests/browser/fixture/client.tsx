import { createRoot, hydrateRoot } from "react-dom/client"
import "leaflet/dist/leaflet.css"
import "releaf/styles.css"
import "./styles.css"
import { LocationPicker } from "../../../stories/examples/LocationPicker"
import { App } from "./app"
import { LayersExample } from "./layers"

const host = document.getElementById("root")!
if (location.pathname === "/hydrate") hydrateRoot(host, <App />)
else
  createRoot(host).render(
    new URLSearchParams(location.search).has("picker") ? (
      <LocationPicker tileUrl="/tiles/{z}/{x}/{y}.svg" />
    ) : new URLSearchParams(location.search).has("layers") ? (
      <LayersExample />
    ) : (
      <App
        navigation={new URLSearchParams(location.search).has("navigation")}
      />
    ),
  )
