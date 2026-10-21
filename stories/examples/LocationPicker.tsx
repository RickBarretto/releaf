import { Map, type Position } from "releaf"

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

/** Complete provider-independent picker; tileUrl lets tests run without network services. */
export function LocationPicker({ tileUrl }: { tileUrl?: string }) {
  return (
    <section className="mx-auto max-w-5xl font-sans">
      <h1>Choose a location</h1>
      <p>
        Search, use your current location, or drag the marker. Location access
        requires HTTPS or localhost.
      </p>
      <Map.Root
        className="picker-map mt-4 h-[600px] overflow-hidden rounded-xl border border-border"
        aria-label="Location picker map"
        initialCenter={[initial.latitude, initial.longitude]}
        initialZoom={13}
        options={{ zoomControl: false }}
        fallback={<p>Loading map…</p>}
      >
        {tileUrl ? (
          <Map.Tiles.Custom url={tileUrl} attribution="Local test tiles" />
        ) : (
          <Map.Tiles.OpenStreetMap />
        )}
        <Map.Navigation />
        <Map.LocationPicker defaultValue={initial}>
          <Map.LocationPicker.Marker />
          <Map.Toolbar
            top
            left
            data-slot="map-panel"
            className="w-80 max-w-[calc(100vw-100px)] flex flex-col gap-3 rounded-xl border bg-background p-3"
          >
            <Map.LocationPicker.Search
              search={(query) =>
                places.filter((place) =>
                  place.label
                    .toLocaleLowerCase()
                    .includes(query.trim().toLocaleLowerCase()),
                )
              }
              getPosition={(place) => place}
            >
              <Map.SearchBar.Input
                aria-label="Find a location"
                placeholder="Try Paris or São Paulo"
              />
              <Map.SearchBar.Results emptyMessage="No matching demo places" />
            </Map.LocationPicker.Search>
            <Map.LocationPicker.Locate />
          </Map.Toolbar>
          <Map.Toolbar bottom left>
            <Map.LocationPicker.Coordinates />
          </Map.Toolbar>
        </Map.LocationPicker>
      </Map.Root>
    </section>
  )
}
