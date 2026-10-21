# DSL Specificatoin

This document guarantees the specification for best usage by our users. We want our library to be composable, reusable and readable, following the best React practices for 2026.

We should not require users to write a bunch of code to have simple features implemented, neither write a bunch of code to get custom features. We should be concise and open to changes, but making changes easier.

## Full-featured Example with <kbd>shadcn/ui</kbd>

```tsx
import { Map, type Position } from "@releaf"
import { Button } from "@/components/ui/button"
import {
  Plus, Minus, Compass, RotateCw,
  MapPin, Maximize2, LocateFixed,
} from "lucide-react"

const home: Position = {
  latitude: 51.5074,
  longitude: -0.1278,
}

const NavigationToolbar = () => {
  const map = Map.useController()

  return (
    <Map.Toolbar top right>
      <div className="flex flex-col gap-1 rounded-xl border bg-background p-1 shadow-lg">
        <Button size="icon" variant="ghost" aria-label="Zoom in"
          onClick={() => map.zoomIn()}>
          <Plus />
        </Button>

        <Button size="icon" variant="ghost" aria-label="Zoom out"
          onClick={() => map.zoomOut()}>
          <Minus />
        </Button>

        <Button size="icon" variant="ghost" aria-label="Rotate right"
          onClick={() => map.rotateBy(45)}>
          <RotateCw />
        </Button>

        <Button size="icon" variant="ghost" aria-label="Reset north"
          onClick={() => map.resetNorth()}>
          <Compass />
        </Button>

        <Button size="icon" variant="ghost" aria-label="Go home"
          onClick={() => map.flyTo(home, 14)}>
          <MapPin />
        </Button>

        <Button size="icon" variant="ghost" aria-label="Locate me"
          onClick={() => map.native.locate({ setView: true })}>
          <LocateFixed />
        </Button>

        <Button size="icon" variant="ghost" aria-label="Fit all markers"
          onClick={() => map.fitBounds([
            { latitude: 51.48, longitude: -0.18 },
            { latitude: 51.54, longitude: -0.07 },
          ])}>
          <Maximize2 />
        </Button>
      </div>
    </Map.Toolbar>
  )
}

const App = () => (
  <Map.Root className="h-screen w-full">
    <Map.View position={home} />
    <Map.Zoom zoom={13} minZoom={3} maxZoom={19} />
    <Map.Rotation enabled />
    <Map.Tiles.OpenStreetMap />

    <Map.Marker position={home}>
    <Map.Popup>Home</Map.Popup>
    </Map.Marker>

    <NavigationToolbar />
  </Map.Root>
)
```

## Coordinate Picker

```tsx
import { useState } from "react"
import { useMapEvents } from "@releaf/events"
import { Map, type Position } from "@releaf"
import { Button } from "@/components/ui/button"

const CoordinatePicker = () => {
  const [selected, setSelected] = useState<Position | null>(null)

  useMapEvents({
    click(event) {
      const [latitude, longitude] = [event.position.latitude, event.position.longitude]
      setSelected({ latitude, longitude })
    }
  })

  const coordinatesToClipboard = () => {
    if (!selected) return
    const coordinates = `${selected.latitude}, ${selected.longitude}`
    navigator.clipboard.writeText(coordinates)
  }

  return (
    <>
      <Map.Toolbar bottom left>
        <div className="rounded-xl border bg-background p-3 shadow-lg">
          <p className="mb-2 text-sm">
            {selected
              ? `${selected.latitude.toFixed(5)}, ${selected.longitude.toFixed(5)}`
              : "Click the map to select a location"}
          </p>

          <Button size="sm" disabled={!selected} onClick={coordinatesToClipboard}>
            Copy coordinates
          </Button>
        </div>
      </Map.Toolbar>

      {selected && <Map.Marker position={selected} />}
    </>
  )
}
```

## Layer Switcher example

```tsx
import { useState } from "react"
import { Map } from "@releaf"
import { Button } from "@/components/ui/button"

type Basemap = "streets" | "topographic"

function LayerSwitcher() {
  const [basemap, setBasemap] = useState<Basemap>("streets")

  return (
    <>
      <Map.Toolbar position="topright">
        <div className="flex gap-1 rounded-xl border bg-background p-1 shadow-lg">
          <Button
            size="sm"
            variant={basemap === "streets" ? "default" : "ghost"}
            onClick={() => setBasemap("streets")}
          >
            Streets
          </Button>
          <Button
            size="sm"
            variant={basemap === "topographic" ? "default" : "ghost"}
            onClick={() => setBasemap("topographic")}
          >
            Terrain
          </Button>
        </div>
      </Map.Toolbar>

      {basemap === "streets" ? (
        <Map.Tiles.OpenStreetMap />
      ) : (
        <Map.Tiles.Custom
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          attribution='Map data © OpenStreetMap contributors, SRTM | Map style © OpenTopoMap (CC-BY-SA)'
          maxZoom={17}
        />
      )}
    </>
  )
}
```

## Rotation and Compass controls

```tsx

import { Map } from "@your-scope/leaflet"
import { Button } from "@/components/ui/button"
import { RotateCcw, RotateCw, Compass } from "lucide-react"

function RotationToolbar() {
  const map = Map.useController()

  return (
    <Map.Toolbar position="bottomright">
      <div className="flex gap-1 rounded-xl border bg-background p-1 shadow-lg">
        <Button size="icon" variant="ghost" aria-label="Rotate left"
          onClick={() => map.rotateBy(-15)}
        >
          <RotateCcw />
        </Button>

        <Button size="icon" variant="ghost" aria-label="Reset orientation"
          onClick={() => map.resetNorth()}
        >
          <Compass />
        </Button>

        <Button size="icon" variant="ghost" aria-label="Rotate right"
          onClick={() => map.rotateBy(15)}
        >
          <RotateCw />
        </Button>
      </div>
    </Map.Toolbar>
  )
}
```

## Action Components

```tsx
<Map.Toolbar top right>
  <Map.Actions.ZoomIn />
  <Map.Actions.ZoomOut />
  <Map.Actions.Locate />
  <Map.Actions.ResetNorth />

  <Map.Actions.FlyTo position={home} zoom={15}>
    <Button variant="secondary">Go home</Button>
  </Map.Actions.FlyTo>
</Map.Toolbar>
```

## Search Bar

```tsx
<Map.SearchBar search={searchPlaces} 
  onSelect={(place) => setDeliveryAddress(place)}>
  <Map.SearchBar.Input placeholder="Delivery address" />
  <Map.SearchBar.Results />
</Map.SearchBar>
```