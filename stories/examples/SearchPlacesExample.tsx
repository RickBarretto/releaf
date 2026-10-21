import { Map } from "releaf"
import { Frame, panel } from "./MapFrame"
import { places } from "./places"

export const SearchPlacesExample = () => (
  <Frame
    title="Search with your own provider"
    description="Search four cities. Results are local demo data; selecting a city flies the map there."
  >
    <Map.Toolbar top left>
      <div className={`${panel} w-72 max-w-[65vw] p-3`}>
        <Map.Search
          search={(query) =>
            places.filter((place) =>
              place.label
                .toLocaleLowerCase()
                .includes(query.toLocaleLowerCase()),
            )
          }
          getPosition={(place) => place}
          placeholder="Try Paris or São Paulo"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Local demo data · Arrow keys + Enter to select
        </p>
      </div>
    </Map.Toolbar>
  </Frame>
)
