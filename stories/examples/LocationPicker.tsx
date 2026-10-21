import type { Marker } from "leaflet"
import { Minus, Plus } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { type Position, Map as ReleafMap, requestCurrentLocation } from "releaf"
import { useMapEvents } from "releaf/events"
import { Button } from "../components/ui/button"
import "./location-picker.css"

const panel =
  "flex w-80 max-w-[calc(100vw-100px)] flex-col gap-3 rounded-xl border bg-background p-4 text-sm text-foreground shadow-lg"

const initial: Position = { latitude: 51.5074, longitude: -0.1278 }
const places = [
  { label: "London · City center", ...initial },
  { label: "Paris · Eiffel Tower", latitude: 48.8584, longitude: 2.2945 },
  {
    label: "São Paulo · Avenida Paulista",
    latitude: -23.5614,
    longitude: -46.6559,
  },
  {
    label: "Rio de Janeiro · Copacabana",
    latitude: -22.9711,
    longitude: -43.1822,
  },
]

function PickerControls() {
  const [selected, setSelected] = useState(initial)
  // Camera changes are separate: dragging the pin should not recenter the map.
  const [camera, setCamera] = useState(initial)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState("")
  const [source, setSource] = useState("Initial location")
  const marker = useRef<Marker>(null)
  const requestId = useRef(0)

  useEffect(
    () => () => {
      requestId.current += 1
    },
    [],
  )

  function select(position: Position, source: string, recenter = false) {
    // A later selection takes precedence over a pending location request.
    requestId.current += 1
    setLocating(false)
    setError("")
    setSelected(position)
    setSource(source)
    if (recenter) setCamera(position)
  }

  useMapEvents({ click: (event) => select(event.position, "Map click") })

  async function locate() {
    const id = ++requestId.current
    setLocating(true)
    setError("")
    try {
      const position = await requestCurrentLocation()
      if (id === requestId.current) select(position, "Current location", true)
    } catch (cause) {
      if (id === requestId.current) {
        setLocating(false)
        setError(
          cause instanceof Error ? cause.message : "Location unavailable",
        )
      }
    }
  }

  return (
    <>
      <ReleafMap.View position={camera} zoom={13} animate={false} />
      <ReleafMap.Toolbar top right>
        <div className="rounded-xl border bg-background p-2 text-foreground shadow-lg flex flex-col gap-1">
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
        </div>
      </ReleafMap.Toolbar>
      <ReleafMap.Marker
        ref={marker}
        position={selected}
        draggable
        options={{
          autoPan: true,
          title: "Drag to select a location",
          alt: "Selected location",
        }}
        eventHandlers={{
          dragend: () => {
            const position = marker.current?.getLatLng()
            if (position)
              select(
                { latitude: position.lat, longitude: position.lng },
                "Marker drag",
              )
          },
        }}
      >
        <ReleafMap.Tooltip>Drag me to refine your selection</ReleafMap.Tooltip>
      </ReleafMap.Marker>
      <ReleafMap.Toolbar top left onClick={(event) => event.stopPropagation()}>
        <div className={panel}>
          <ReleafMap.SearchBar
            className="flex flex-col gap-2 [&_[role=status]:empty]:hidden [&_[role=listbox]:empty]:hidden"
            search={(query) =>
              places.filter((place) =>
                place.label
                  .toLocaleLowerCase()
                  .includes(query.trim().toLocaleLowerCase()),
              )
            }
            onSelect={(place) =>
              select(
                { latitude: place.latitude, longitude: place.longitude },
                "Search result",
                true,
              )
            }
          >
            <ReleafMap.SearchBar.Input
              aria-label="Find a location"
              placeholder="Try Paris or São Paulo"
            />
            <ReleafMap.SearchBar.Results
              className="m-0 list-none p-0 [&_[role=option]]:cursor-pointer [&_[role=option]]:rounded-sm [&_[role=option]]:px-2 [&_[role=option]]:py-1.5 [&_[aria-selected=true]]:bg-accent [&_[aria-selected=true]]:text-accent-foreground"
              emptyMessage="No matching demo places"
              errorMessage="Search failed. Try again."
            />
          </ReleafMap.SearchBar>
          <p className="m-0 text-xs leading-relaxed text-muted-foreground">
            Four demo places · Use arrow keys and Enter to select.
          </p>
          <Button type="button" disabled={locating} onClick={locate}>
            {locating
              ? "Finding your location…"
              : error
                ? "Retry current location"
                : "Use current location"}
          </Button>
          <span
            role="status"
            className="block text-xs text-muted-foreground empty:hidden"
          >
            {locating ? "Allow location access when your browser asks." : ""}
          </span>
          {error && (
            <p role="alert" className="m-0 text-sm text-destructive">
              {error} You can still search or choose on the map.
            </p>
          )}
        </div>
      </ReleafMap.Toolbar>
      <ReleafMap.Toolbar bottom left>
        <div className={panel} role="status" aria-label="Selected coordinates">
          <strong>Selected coordinates</strong>
          <output className="block" aria-label="Latitude and longitude">
            {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}
          </output>
          <p className="m-0 text-xs leading-relaxed text-muted-foreground">
            {source} · Click the map or drag the marker to refine.
          </p>
        </div>
      </ReleafMap.Toolbar>
    </>
  )
}

/** Complete provider-independent picker; tileUrl lets tests run without network services. */
export function LocationPicker({ tileUrl }: { tileUrl?: string }) {
  return (
    <section className="location-picker">
      <h1>Choose a location</h1>
      <p>
        Search, use your current location, or drag the marker. Location access
        requires HTTPS or localhost.
      </p>
      <ReleafMap.Root
        className="location-picker-map"
        aria-label="Location picker map"
        initialCenter={[initial.latitude, initial.longitude]}
        initialZoom={13}
        options={{ zoomControl: false }}
        fallback={<p>Loading map…</p>}
      >
        {tileUrl ? (
          <ReleafMap.Tiles.Custom
            url={tileUrl}
            attribution="Local test tiles"
          />
        ) : (
          <ReleafMap.Tiles.OpenStreetMap />
        )}
        <PickerControls />
      </ReleafMap.Root>
    </section>
  )
}
