import type { Meta, StoryObj } from "@storybook/react-vite"
import { Copy, LocateFixed, MapPin, Maximize2, Minus, Plus } from "lucide-react"
import { type ReactNode, useState } from "react"
import { type Position, Map as ReleafMap } from "releaf"
import { useMapEvents } from "releaf/events"
import { Button } from "@/components/ui/button"

const home: Position = { latitude: 51.5074, longitude: -0.1278 }
const places = [
  { id: "home", label: "London · City center", ...home },
  {
    id: "paris",
    label: "Paris · Eiffel Tower",
    latitude: 48.8584,
    longitude: 2.2945,
  },
  {
    id: "sao-paulo",
    label: "São Paulo · Avenida Paulista",
    latitude: -23.5614,
    longitude: -46.6559,
  },
  {
    id: "rio",
    label: "Rio de Janeiro · Copacabana",
    latitude: -22.9711,
    longitude: -43.1822,
  },
]
const panel = "rounded-xl border bg-background p-2 text-foreground shadow-lg"

function Frame({
  children,
  title,
  description,
  zoom = 13,
  tiles = true,
}: {
  children?: ReactNode
  title: string
  description: string
  zoom?: number
  tiles?: boolean
}) {
  return (
    <section className="mx-auto max-w-6xl space-y-4 p-2">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Releaf playground
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>
      <ReleafMap.Root
        className="demo-map h-[520px]"
        options={{ zoomControl: false, zoomAnimation: false }}
        fallback={<p>Loading map…</p>}
      >
        <ReleafMap.View position={home} />
        <ReleafMap.Zoom zoom={zoom} minZoom={3} maxZoom={19} />
        {tiles && <ReleafMap.Tiles.OpenStreetMap />}
        {children}
      </ReleafMap.Root>
    </section>
  )
}

function Navigation() {
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

function Playground({ zoom }: { zoom: number }) {
  return (
    <Frame
      title="Your map, your controls"
      description="Pan the map, open a marker, or try the navigation toolbar. Adjust zoom in Storybook Controls."
      zoom={zoom}
    >
      <ReleafMap.Marker position={home}>
        <ReleafMap.Popup>
          <strong>Home</strong>
          <p>London, United Kingdom</p>
        </ReleafMap.Popup>
      </ReleafMap.Marker>
      <ReleafMap.Marker position={{ latitude: 51.515, longitude: -0.09 }}>
        <ReleafMap.Popup>Another stop</ReleafMap.Popup>
      </ReleafMap.Marker>
      <Navigation />
    </Frame>
  )
}
const meta = {
  title: "Map/DSL",
  component: Playground,
  args: { zoom: 13 },
  argTypes: {
    zoom: { control: { type: "range", min: 3, max: 19, step: 1 } },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Interactive examples of the compound Map API with development-only shadcn/ui buttons. Map tiles require internet access. Geolocation requires browser permission and a secure context (localhost works).",
      },
    },
  },
} satisfies Meta<typeof Playground>
export default meta
type Story = StoryObj<typeof meta>
export const NavigationPlayground: Story = {}

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

function PlaceSearch() {
  const map = ReleafMap.useController()
  const [selected, setSelected] = useState<(typeof places)[number] | null>(null)
  return (
    <>
      <ReleafMap.Toolbar top left>
        <div className={`${panel} w-72 max-w-[65vw] p-3`}>
          <ReleafMap.SearchBar
            search={(query) =>
              places.filter((place) =>
                place.label
                  .toLocaleLowerCase()
                  .includes(query.toLocaleLowerCase()),
              )
            }
            onSelect={(place) => {
              setSelected(place)
              map.flyTo(place, 13)
            }}
          >
            <ReleafMap.SearchBar.Input
              placeholder="Try Paris or São Paulo"
              aria-label="Find a city"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <ReleafMap.SearchBar.Results
              className="mt-2 space-y-1 text-sm [&_[role=option]]:cursor-pointer [&_[role=option]]:rounded-md [&_[role=option]]:p-2 [&_[aria-selected=true]]:bg-accent"
              emptyMessage="No matching cities"
            />
          </ReleafMap.SearchBar>
          <p className="mt-2 text-xs text-muted-foreground">
            Local demo data · Arrow keys + Enter to select
          </p>
        </div>
      </ReleafMap.Toolbar>
      {selected && (
        <ReleafMap.Marker position={selected}>
          <ReleafMap.Popup open>{selected.label}</ReleafMap.Popup>
        </ReleafMap.Marker>
      )}
    </>
  )
}
export const SearchPlaces: Story = {
  render: () => (
    <Frame
      title="Search with your own provider"
      description="Search four cities. Results are local demo data; selecting a city flies the map there."
    >
      <PlaceSearch />
    </Frame>
  ),
  parameters: { controls: { disable: true } },
}

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
