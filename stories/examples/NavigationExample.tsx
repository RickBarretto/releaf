import { Map } from "releaf"

import { Frame, home } from "./MapFrame"

import { Navigation } from "./Navigation"

export function Playground({ zoom }: { zoom: number }) {
  return (
    <Frame
      title="Your map, your controls"
      description="Pan the map, open a marker, or try the navigation toolbar. Adjust zoom in Storybook Controls."
      zoom={zoom}
    >
      <Map.Marker position={home}>
        <Map.Popup>
          <strong>Home</strong>
          <p>London, United Kingdom</p>
        </Map.Popup>
      </Map.Marker>
      <Map.Marker position={{ latitude: 51.515, longitude: -0.09 }}>
        <Map.Popup>Another stop</Map.Popup>
      </Map.Marker>
      <Navigation />
    </Frame>
  )
}
