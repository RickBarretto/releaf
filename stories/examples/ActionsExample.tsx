import { LocateFixed, MapPin, Minus, Plus } from "lucide-react"

import { Map } from "releaf"

import { Button } from "../components/ui/button"

import { Frame, home, panel } from "./MapFrame"

export const ActionsExample = () => (
  <Frame
    title="Actions without a controller"
    description="Drop in the built-in actions, or give them your own shadcn button."
  >
    <Map.Marker position={home}>
      <Map.Popup>Try Go home after panning away.</Map.Popup>
    </Map.Marker>
    <Map.Toolbar top right>
      <div className={`${panel} flex flex-wrap items-center gap-1`}>
        <Map.Actions.ZoomIn>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Zoom in"
            title="Zoom in"
          >
            <Plus />
          </Button>
        </Map.Actions.ZoomIn>
        <Map.Actions.ZoomOut>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Zoom out"
            title="Zoom out"
          >
            <Minus />
          </Button>
        </Map.Actions.ZoomOut>
        <Map.Actions.Locate>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Locate me"
            title="Locate me"
          >
            <LocateFixed />
          </Button>
        </Map.Actions.Locate>
        <Map.Actions.FlyTo position={home} zoom={15}>
          <Button
            variant="secondary"
            aria-label="Return to London"
            title="Return to London"
          >
            <MapPin />
            Go home
          </Button>
        </Map.Actions.FlyTo>
      </div>
    </Map.Toolbar>
  </Frame>
)
