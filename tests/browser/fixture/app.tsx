import type * as L from "leaflet"
import { StrictMode, useState } from "react"
import {
  MapContainer,
  type Position,
  Map as ReleafMap,
  useMapEvents,
  useMapView,
} from "releaf"
export function App() {
  const [mounted, setMounted] = useState(true)
  const [wide, setWide] = useState(false)
  return (
    <StrictMode>
      <button type="button" onClick={() => setMounted(!mounted)}>
        Toggle map
      </button>
      <button type="button" onClick={() => setWide(!wide)}>
        Resize map
      </button>
      <div style={{ width: wide ? 900 : 700 }}>
        {mounted && (
          <MapContainer
            eventHandlers={{
              movestart: (event) => {
                event.target.getContainer().dataset.moving = "true"
              },
              moveend: (event) => {
                event.target.getContainer().dataset.moving = "false"
              },
            }}
            initialZoom={5}
            className="test-map"
            options={{
              zoomAnimation: false,
              fadeAnimation: false,
              zoomControl: false,
            }}
            fallback={<p>Loading map</p>}
          >
            <ReleafMap.Tiles.Custom url="/tiles/{z}/{x}/{y}.svg" />
            <ReleafMap.Marker
              position={[0, 0]}
              options={{ draggable: true }}
              eventHandlers={{
                dragend: (e) => {
                  const p = (e.target as L.Marker).getLatLng()
                  document.querySelector('[data-testid="drag"]')!.textContent =
                    `${p.lat},${p.lng}`
                },
              }}
            >
              <ReleafMap.Popup>
                <Counter />
              </ReleafMap.Popup>
              <ReleafMap.Tooltip>Marker tooltip</ReleafMap.Tooltip>
            </ReleafMap.Marker>
            <Status />
          </MapContainer>
        )}
      </div>
      <output data-testid="drag" />
    </StrictMode>
  )
}
function Counter() {
  const [count, setCount] = useState(0)
  return (
    <button type="button" onClick={() => setCount(count + 1)}>
      Popup count {count}
    </button>
  )
}
function Status() {
  const view = useMapView()
  const [clicked, setClicked] = useState<Position | null>(null)
  const [selected, setSelected] = useState("")
  useMapEvents({ click: (e) => setClicked(e.position) })
  return (
    <>
      <output data-testid="view">{JSON.stringify(view)}</output>
      <output data-testid="click">{JSON.stringify(clicked)}</output>
      <output data-testid="selected">{selected}</output>
      <ReleafMap.Toolbar bottom left>
        <ReleafMap.Actions.ZoomIn />
        <ReleafMap.Actions.ZoomOut />
        <ReleafMap.Actions.FlyTo
          position={{ latitude: 2, longitude: 2 }}
          zoom={6}
          options={{ animate: false }}
        >
          Fly home
        </ReleafMap.Actions.FlyTo>
        <ReleafMap.SearchBar
          debounceMs={0}
          search={(q) => [{ label: `${q} City` }, { label: `${q} Town` }]}
          onSelect={(p) => setSelected(p.label)}
        >
          <ReleafMap.SearchBar.Input />
          <ReleafMap.SearchBar.Results />
        </ReleafMap.SearchBar>
      </ReleafMap.Toolbar>
    </>
  )
}
