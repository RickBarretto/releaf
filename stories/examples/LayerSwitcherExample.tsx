// biome-ignore lint/suspicious/noShadowRestrictedNames: Map is the public compound component API.
import { Map } from "releaf"
import { Frame } from "./MapFrame"

export const LayerSwitcherExample = () => (
  <Frame
    title="Switch your basemap"
    description="Swap tile providers declaratively while keeping the map and camera."
    tiles={false}
  >
    <Map.Toolbar top left>
      <Map.LayerSwitcher
        defaultValue="streets"
        options={[
          {
            value: "streets",
            label: "Streets",
            layer: <Map.Tiles.OpenStreetMap />,
          },
          {
            value: "terrain",
            label: "Terrain",
            layer: (
              <Map.Tiles.Custom
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                attribution="Map data © OpenStreetMap contributors, SRTM | Map style © OpenTopoMap (CC-BY-SA)"
                maxZoom={17}
              />
            ),
          },
        ]}
      />
    </Map.Toolbar>
  </Frame>
)
