// biome-ignore lint/suspicious/noShadowRestrictedNames: Map is the public compound component API.
import { Map } from "releaf"
import { Frame } from "./MapFrame"

export function CurrentLocationExample() {
  return (
    <Frame
      title="Find your current location"
      description="Enable location to center the map on you. Requires HTTPS or localhost."
    >
      <Map.LocationPicker zoom={16} />
    </Frame>
  )
}
