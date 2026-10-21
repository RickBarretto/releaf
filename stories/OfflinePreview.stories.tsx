import type { Meta, StoryObj } from "@storybook/react-vite"
import { Map as ReleafMap } from "releaf"
import { Frame, home } from "./examples/MapFrame"
import { Navigation } from "./examples/Navigation"

const meta = {
  title: "Map/Offline Preview",
  parameters: { controls: { disable: true } },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

const grid = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#f0f5ed"/><path d="M0 0H256V256H0Z M128 0V256 M0 128H256" stroke="#c8d8bf" fill="none"/><path d="M0 60L256 190 M80 0L190 256" stroke="#fff" stroke-width="12"/></svg>')}`
export const OfflinePreview: Story = {
  render: () => (
    <Frame
      title="Explore without tile services"
      description="This schematic grid is generated locally. Test markers and navigation even without internet access."
      tiles={false}
    >
      <ReleafMap.Tiles.Custom
        url={grid}
        attribution="Local schematic grid · Not geographic map data"
      />
      <ReleafMap.Marker position={home}>
        <ReleafMap.Popup>Home on the offline grid</ReleafMap.Popup>
      </ReleafMap.Marker>
      <Navigation />
    </Frame>
  ),
  parameters: { controls: { disable: true } },
}
