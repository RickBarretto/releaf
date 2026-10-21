import type * as L from "leaflet"
import { StrictMode, useState } from "react"
import {
  MapContainer,
  type Position,
  Map as ReleafMap,
  useController,
  useMapEvents,
  useMapView,
} from "releaf"
export function App() {
  const [mounted, setMounted] = useState(true)
  const [wide, setWide] = useState(false)
  const [rotation, setRotation] = useState(true)
  return (
    <StrictMode>
      <button type="button" onClick={() => setMounted(!mounted)}>
        Toggle map
      </button>
      <button type="button" onClick={() => setWide(!wide)}>
        Resize map
      </button>
      <button type="button" onClick={() => setRotation(!rotation)}>
        Toggle rotation
      </button>
      <div style={{ width: wide ? 900 : 700 }}>
        {mounted && (
          <MapContainer
            initialZoom={5}
            style={{ height: 450 }}
            options={{
              zoomAnimation: false,
              fadeAnimation: false,
              zoomControl: false,
            }}
            fallback={<p>Loading map</p>}
          >
            <ReleafMap.Tiles.Custom url="/tiles/{z}/{x}/{y}.svg" />
            <ReleafMap.Rotation enabled={rotation} />
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
  const controller = useController()
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
        <button type="button" onClick={() => controller.rotateBy(45)}>
          Rotate
        </button>
        <ReleafMap.Actions.ResetNorth />
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
