import { LocateFixed, MapPin, Maximize2, Minus, Plus } from "lucide-react"
import { Map as ReleafMap } from "releaf"
import { Button } from "../components/ui/button"
import { home, panel } from "./MapFrame"

export function Navigation() {
  const map = ReleafMap.useController()
  return (
    <ReleafMap.Toolbar top right>
      <div className={`${panel} flex flex-col gap-1`}>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Zoom in"
          title="Zoom in"
          onClick={() => map.zoomIn()}
        >
          <Plus />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Zoom out"
          title="Zoom out"
          onClick={() => map.zoomOut()}
        >
          <Minus />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Go home"
          title="Go home"
          onClick={() => map.flyTo(home, 14)}
        >
          <MapPin />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Locate me"
          title="Locate me"
          onClick={() => map.native.locate({ setView: true })}
        >
          <LocateFixed />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Fit markers"
          title="Fit markers"
          onClick={() =>
            map.fitBounds([home, { latitude: 51.515, longitude: -0.09 }], {
              padding: [50, 50],
            })
          }
        >
          <Maximize2 />
        </Button>
      </div>
    </ReleafMap.Toolbar>
  )
}
