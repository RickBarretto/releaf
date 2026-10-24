import { useState } from "react"
import { Map as ReleafMap } from "releaf"

export function LayersExample() {
  const [count, setCount] = useState(2)
  const [value, setValue] = useState("missing")
  const [changes, setChanges] = useState(0)
  const options = [
    {
      value: "one",
      label: "First basemap",
      layer: <ReleafMap.Tiles.Custom url="/tiles/one/{z}/{x}/{y}.svg" />,
    },
    {
      value: "two",
      label: "Second basemap",
      layer: <ReleafMap.Tiles.Custom url="/tiles/two/{z}/{x}/{y}.svg" />,
    },
  ].slice(0, count)
  return (
    <>
      <button type="button" onClick={() => setCount(1)}>
        Remove second layer
      </button>
      <button type="button" onClick={() => setCount(0)}>
        Remove all layers
      </button>
      <output aria-label="Layer changes">{changes}</output>
      <ReleafMap.Root
        className="test-map layer-test-map"
        options={{ zoomControl: false }}
      >
        <ReleafMap.Toolbar top left>
          <ReleafMap.LayerSwitcher
            className="layer-options"
            options={options}
            value={value}
            onValueChange={(next) => {
              setValue(next)
              setChanges((count) => count + 1)
            }}
          />
        </ReleafMap.Toolbar>
      </ReleafMap.Root>
    </>
  )
}
