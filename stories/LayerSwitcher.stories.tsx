import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { Map as ReleafMap } from "releaf"
import { Button } from "./components/ui/button"
import { Frame, panel } from "./examples/MapFrame"

const meta = {
  title: "Map/Layer Switcher",
  parameters: { controls: { disable: true } },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

function Layers() {
  const [basemap, setBasemap] = useState<"streets" | "terrain">("streets")
  return (
    <>
      <ReleafMap.Toolbar top left>
        <div className={`${panel} flex gap-1`}>
          <Button
            size="sm"
            variant={basemap === "streets" ? "default" : "ghost"}
            aria-label="Show street map"
            title="Show street map"
            aria-pressed={basemap === "streets"}
            onClick={() => setBasemap("streets")}
          >
            Streets
          </Button>
          <Button
            size="sm"
            variant={basemap === "terrain" ? "default" : "ghost"}
            aria-label="Show terrain map"
            title="Show terrain map"
            aria-pressed={basemap === "terrain"}
            onClick={() => setBasemap("terrain")}
          >
            Terrain
          </Button>
        </div>
      </ReleafMap.Toolbar>
      {basemap === "streets" ? (
        <ReleafMap.Tiles.OpenStreetMap />
      ) : (
        <ReleafMap.Tiles.Custom
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          attribution="Map data © OpenStreetMap contributors, SRTM | Map style © OpenTopoMap (CC-BY-SA)"
          maxZoom={17}
        />
      )}
    </>
  )
}
export const LayerSwitcher: Story = {
  render: () => (
    <Frame
      title="Switch your basemap"
      description="Swap tile providers declaratively while keeping the map and camera."
      tiles={false}
    >
      <Layers />
    </Frame>
  ),
  parameters: { controls: { disable: true } },
}
