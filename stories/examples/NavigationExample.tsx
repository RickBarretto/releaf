import { Map as ReleafMap } from "releaf"

import { Frame, home } from "./MapFrame"

import { Navigation } from "./Navigation"

export function Playground({ zoom }: { zoom: number }) {
  return (
    <Frame
      title="Your map, your controls"
      description="Pan the map, open a marker, or try the navigation toolbar. Adjust zoom in Storybook Controls."
      zoom={zoom}
    >
      <ReleafMap.Marker position={home}>
        <ReleafMap.Popup>
          <strong>Home</strong>
          <p>London, United Kingdom</p>
        </ReleafMap.Popup>
      </ReleafMap.Marker>
      <ReleafMap.Marker position={{ latitude: 51.515, longitude: -0.09 }}>
        <ReleafMap.Popup>Another stop</ReleafMap.Popup>
      </ReleafMap.Marker>
      <Navigation />
    </Frame>
  )
}
