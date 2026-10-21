import { useState } from "react"

import { Map } from "releaf"

import { Frame, panel } from "./MapFrame"

import { places } from "./places"

function PlaceSearch() {
  const map = Map.useController()
  const [selected, setSelected] = useState<(typeof places)[number] | null>(null)
  return (
    <>
      <Map.Toolbar top left>
        <div className={`${panel} w-72 max-w-[65vw] p-3`}>
          <Map.SearchBar
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
            <Map.SearchBar.Input
              placeholder="Try Paris or São Paulo"
              aria-label="Find a city"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Map.SearchBar.Results
              className="mt-2 space-y-1 text-sm [&_[role=option]]:cursor-pointer [&_[role=option]]:rounded-md [&_[role=option]]:p-2 [&_[aria-selected=true]]:bg-accent"
              emptyMessage="No matching cities"
            />
          </Map.SearchBar>
          <p className="mt-2 text-xs text-muted-foreground">
            Local demo data · Arrow keys + Enter to select
          </p>
        </div>
      </Map.Toolbar>
      {selected && (
        <Map.Marker position={selected}>
          <Map.Popup open>{selected.label}</Map.Popup>
        </Map.Marker>
      )}
    </>
  )
}

export const SearchPlacesExample = () => (
  <Frame
    title="Search with your own provider"
    description="Search four cities. Results are local demo data; selecting a city flies the map there."
  >
    <PlaceSearch />
  </Frame>
)
