import type { Preview } from "@storybook/react-vite"
import { divIcon, Marker } from "leaflet"
import "leaflet/dist/leaflet.css"
import "../stories/styles.css"

// Local div icons avoid bundler-specific default PNG path detection.
Marker.mergeOptions({
  icon: divIcon({
    className: "demo-marker",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
  }),
})

const preview: Preview = {
  parameters: {
    layout: "padded",
    controls: { expanded: true },
    options: { storySort: { order: ["Map", "Development"] } },
  },
  tags: ["autodocs"],
}
export default preview
