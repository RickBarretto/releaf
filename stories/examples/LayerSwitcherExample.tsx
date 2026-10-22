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
      <Map.LayerSwitcher defaultValue="streets">
        <Map.LayerSwitcher.Item value="streets" label="Streets">
          <Map.Tiles.OpenStreetMap />
        </Map.LayerSwitcher.Item>
        <Map.LayerSwitcher.Item value="terrain" label="Terrain">
          <Map.Tiles.Custom
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            attribution="Map data © OpenStreetMap contributors, SRTM | Map style © OpenTopoMap (CC-BY-SA)"
            maxZoom={17}
          />
        </Map.LayerSwitcher.Item>
      </Map.LayerSwitcher>
    </Map.Toolbar>
  </Frame>
)
