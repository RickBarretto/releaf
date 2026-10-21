import type { Meta, StoryObj } from "@storybook/react-vite"
import { Copy } from "lucide-react"
import { useState } from "react"
import type { Position } from "releaf"
import { Map as ReleafMap } from "releaf"
import { useMapEvents } from "releaf/events"
import { Button } from "./components/ui/button"
import { Frame, panel } from "./examples/MapFrame"

const meta = {
  title: "Map/Coordinate Picker",
  parameters: { controls: { disable: true } },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

function Picker() {
  const [selected, setSelected] = useState<Position | null>(null)
  const [status, setStatus] = useState("")
  useMapEvents({
    click: (event) => {
      setSelected(event.position)
      setStatus("")
    },
  })
  async function copy() {
    if (!selected) return
    try {
      await navigator.clipboard.writeText(
        `${selected.latitude}, ${selected.longitude}`,
      )
      setStatus("Coordinates copied")
    } catch {
      setStatus("Clipboard unavailable. Select and copy the coordinates above.")
    }
  }
  return (
    <>
      <ReleafMap.Toolbar bottom left>
        <div className={`${panel} max-w-72 space-y-2 p-3`}>
          <p className="text-sm">
            {selected
              ? `${selected.latitude.toFixed(5)}, ${selected.longitude.toFixed(5)}`
              : "Click the map to select a location"}
          </p>
          <Button
            size="sm"
            aria-label="Copy selected coordinates"
            title="Copy selected coordinates"
            disabled={!selected}
            onClick={copy}
          >
            <Copy />
            Copy coordinates
          </Button>
          <p className="text-xs text-muted-foreground" role="status">
            {status}
          </p>
        </div>
      </ReleafMap.Toolbar>
      {selected && <ReleafMap.Marker position={selected} />}
    </>
  )
}
export const CoordinatePicker: Story = {
  render: () => (
    <Frame
      title="Pick a coordinate"
      description="Click anywhere on the map. The events hook returns a typed latitude and longitude."
    >
      <Picker />
    </Frame>
  ),
  parameters: { controls: { disable: true } },
}
