import { Map } from "releaf"
import { Frame } from "./MapFrame"

export const CoordinatePickerExample = () => (
  <Frame
    title="Pick a coordinate"
    description="Click anywhere on the map, then copy the selected coordinates."
  >
    <Map.LocationPicker>
      <Map.LocationPicker.Marker />
      <Map.Toolbar bottom left>
        <Map.LocationPicker.Coordinates />
      </Map.Toolbar>
    </Map.LocationPicker>
  </Frame>
)
