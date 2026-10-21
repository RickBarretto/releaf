import type { Meta, StoryObj } from "@storybook/react-vite"
import { LocateFixed, MapPin, Minus, Plus } from "lucide-react"
import { Map as ReleafMap } from "releaf"
import { Button } from "./components/ui/button"
import { Frame, home, panel } from "./examples/MapFrame"

const meta = {
  title: "Map/Actions",
  parameters: { controls: { disable: true } },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const ActionComponents: Story = {
  render: () => (
    <Frame
      title="Actions without a controller"
      description="Drop in the built-in actions, or give them your own shadcn button."
    >
      <ReleafMap.Marker position={home}>
        <ReleafMap.Popup>Try Go home after panning away.</ReleafMap.Popup>
      </ReleafMap.Marker>
      <ReleafMap.Toolbar top right>
        <div className={`${panel} flex flex-wrap items-center gap-1`}>
          <ReleafMap.Actions.ZoomIn>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Zoom in"
              title="Zoom in"
            >
              <Plus />
            </Button>
          </ReleafMap.Actions.ZoomIn>
          <ReleafMap.Actions.ZoomOut>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Zoom out"
              title="Zoom out"
            >
              <Minus />
            </Button>
          </ReleafMap.Actions.ZoomOut>
          <ReleafMap.Actions.Locate>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Locate me"
              title="Locate me"
            >
              <LocateFixed />
            </Button>
          </ReleafMap.Actions.Locate>
          <ReleafMap.Actions.FlyTo position={home} zoom={15}>
            <Button
              variant="secondary"
              aria-label="Return to London"
              title="Return to London"
            >
              <MapPin />
              Go home
            </Button>
          </ReleafMap.Actions.FlyTo>
        </div>
      </ReleafMap.Toolbar>
    </Frame>
  ),
  parameters: { controls: { disable: true } },
}
