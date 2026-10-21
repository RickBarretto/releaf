import type * as Leaflet from "leaflet"
import { act, createRef, useState } from "react"
import { afterEach, expect, test, vi } from "vitest"
import { cleanup, click, observers, render, waitFor } from "./helpers"

afterEach(cleanup)

const {
  Map: ReleafMap,
  MapContainer,
  MapView,
  Marker,
  TileLayer,
  CircleMarker,
  Polyline,
  Polygon,
  Rectangle,
  ImageOverlay,
  GeoJSON,
  useMapView,
  useMapEvents,
} = await import("../../src/index")

test("creation-only map options, camera freedom, keyed recreation and resize", async () => {
  const ref = createRef<Leaflet.Map>()
  const tree = (key: number, zoom: number) => (
    <MapContainer key={key} ref={ref} initialZoom={zoom}>
      <MapView center={[1, 2]} zoom={5} />
    </MapContainer>
  )
  await render(tree(1, 3))
  const map = ref.current!

  const invalidate = vi.spyOn(map, "invalidateSize")
  observers.at(-1)!.callback()
  expect(invalidate).toHaveBeenCalledWith({ pan: false })

  await act(async () => {
    map.setView([4, 5], 6)
  })
  await render(tree(1, 9))
  expect(ref.current).toBe(map)
  expect(map.getZoom()).toBe(6)

  await render(tree(2, 9))
  expect(ref.current).not.toBe(map)

  invalidate.mockRestore()
})

test("mutable layer props update in place and restore creation defaults", async () => {
  const marker = createRef<Leaflet.Marker>()
  const tile = createRef<Leaflet.TileLayer>()
  const circle = createRef<Leaflet.CircleMarker>()
  const line = createRef<Leaflet.Polyline>()
  const polygon = createRef<Leaflet.Polygon>()
  const rectangle = createRef<Leaflet.Rectangle>()
  const image = createRef<Leaflet.ImageOverlay>()

  const tree = (changed: boolean) => (
    <MapContainer>
      <Marker
        ref={marker}
        position={changed ? [3, 4] : [1, 2]}
        options={{ opacity: 0.7, draggable: true, zIndexOffset: 5 }}
        opacity={changed ? undefined : 0.2}
        draggable={changed ? undefined : false}
        zIndexOffset={changed ? undefined : 9}
      />
      <TileLayer
        ref={tile}
        url={changed ? "/new/{z}/{x}/{y}" : "/old/{z}/{x}/{y}"}
        options={{ zIndex: 4 }}
        zIndex={changed ? undefined : 8}
      />
      <CircleMarker
        ref={circle}
        center={changed ? [3, 4] : [1, 2]}
        options={{ radius: 12, color: "green" }}
        radius={changed ? undefined : 20}
        pathOptions={changed ? undefined : { color: "red" }}
      />
      <Polyline
        ref={line}
        positions={
          changed
            ? [
                [3, 4],
                [5, 6],
              ]
            : [
                [0, 0],
                [1, 1],
              ]
        }
      />
      <Polygon
        ref={polygon}
        positions={
          changed
            ? [
                [3, 4],
                [5, 6],
                [7, 8],
              ]
            : [
                [0, 0],
                [1, 1],
                [2, 2],
              ]
        }
      />
      <Rectangle
        ref={rectangle}
        bounds={
          changed
            ? [
                [3, 4],
                [5, 6],
              ]
            : [
                [0, 0],
                [1, 1],
              ]
        }
      />
      <ImageOverlay
        ref={image}
        url="/image.svg"
        bounds={[
          [0, 0],
          [1, 1],
        ]}
        options={{ zIndex: 3 }}
        zIndex={changed ? undefined : 7}
      />
    </MapContainer>
  )

  await render(tree(false))

  const instances = [
    marker.current,
    tile.current,
    circle.current,
    line.current,
    polygon.current,
    rectangle.current,
    image.current,
  ]

  await render(tree(true))
  expect([
    marker.current,
    tile.current,
    circle.current,
    line.current,
    polygon.current,
    rectangle.current,
    image.current,
  ]).toEqual(instances)
  expect(marker.current!.getLatLng().equals([3, 4])).toBe(true)
  expect(marker.current!.options.opacity).toBe(0.7)
  expect(marker.current!.dragging!.enabled()).toBe(true)
  expect(marker.current!.options.zIndexOffset).toBe(5)
  expect(
    tile.current!.getTileUrl({ x: 0, y: 0, z: 2 } as Leaflet.Coords),
  ).toContain("/new/")
  expect(tile.current!.options.zIndex).toBe(4)
  expect(circle.current!.getRadius()).toBe(12)
  expect(circle.current!.options.color).toBe("green")
  expect(circle.current!.getLatLng().equals([3, 4])).toBe(true)
  expect((line.current!.getLatLngs()[0] as Leaflet.LatLng).equals([3, 4])).toBe(
    true,
  )
  expect(
    (polygon.current!.getLatLngs()[0] as Leaflet.LatLng[])[0].equals([3, 4]),
  ).toBe(true)
  expect(rectangle.current!.getBounds().getSouthWest().equals([3, 4])).toBe(
    true,
  )
  expect(image.current!.options.zIndex).toBe(3)
})

test("GeoJSON clears absent data and does not replace unchanged features", async () => {
  const ref = createRef<Leaflet.GeoJSON>()
  const data = {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: [
        [0, 0],
        [1, 1],
      ],
    },
  }
  await render(
    <MapContainer>
      <GeoJSON ref={ref} data={data} />
    </MapContainer>,
  )
  const child = ref.current!.getLayers()[0]
  await render(
    <MapContainer>
      <GeoJSON ref={ref} data={data} pathOptions={{ color: "red" }} />
    </MapContainer>,
  )
  expect(ref.current!.getLayers()[0]).toBe(child)
  await render(
    <MapContainer>
      <GeoJSON ref={ref} data={undefined} />
    </MapContainer>,
  )
  expect(ref.current!.getLayers()).toHaveLength(0)
})

test("actions compose handlers, cancellation, disabled children and controller methods", async () => {
  const ref = createRef<Leaflet.Map>()
  let controller!: ReturnType<typeof ReleafMap.useController>
  const calls: string[] = []
  function Controls() {
    controller = ReleafMap.useController()
    return (
      <ReleafMap.Toolbar>
        <ReleafMap.Actions.ZoomIn onClick={() => calls.push("parent")}>
          <button type="button" onClick={() => calls.push("child")}>
            Go
          </button>
        </ReleafMap.Actions.ZoomIn>
        <ReleafMap.Actions.ZoomOut onClick={(e) => e.preventDefault()}>
          Cancel
        </ReleafMap.Actions.ZoomOut>
        <ReleafMap.Actions.ZoomIn>
          <button type="button" disabled>
            Disabled
          </button>
        </ReleafMap.Actions.ZoomIn>
        <ReleafMap.Actions.Locate options={{ setView: false }} />
      </ReleafMap.Toolbar>
    )
  }
  await render(
    <ReleafMap.Root ref={ref}>
      <ReleafMap.Rotation animate={false} />
      <Controls />
    </ReleafMap.Root>,
  )
  const map = ref.current!,
    zoom = map.getZoom()
  await click(
    Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent === "Go",
    )!,
  )
  // Use text to distinguish the toolbar from Leaflet's built-in controls.
  expect(calls).toEqual(["child", "parent"])
  expect(map.getZoom()).toBe(zoom + 1)
  await click(
    Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent === "Cancel",
    )!,
  )
  await click(
    Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent === "Disabled",
    )!,
  )
  expect(map.getZoom()).toBe(zoom + 1)
  const locate = vi.spyOn(map, "locate").mockImplementation(() => map)
  await click(
    Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent === "Locate me",
    )!,
  )
  expect(locate).toHaveBeenCalledWith({ setView: false })
  const fly = vi.spyOn(map, "flyTo").mockImplementation(() => map)
  controller.flyTo({ latitude: 3, longitude: 4 }, 7, { animate: false })
  expect(fly).toHaveBeenCalledWith([3, 4], 7, { animate: false })
  const fit = vi.spyOn(map, "fitBounds").mockImplementation(() => map)
  controller.fitBounds([{ latitude: 1, longitude: 2 }, [3, 4]])
  expect(fit).toHaveBeenCalledWith(
    [
      [1, 2],
      [3, 4],
    ],
    undefined,
  )
  controller.rotateBy(-45)
  expect(map.getPane("mapPane")!.style.rotate).toBe("315deg")
  controller.resetNorth()
  expect(map.getPane("mapPane")!.style.rotate).toBe("0deg")
  locate.mockRestore()
  fly.mockRestore()
  fit.mockRestore()
})

test("view snapshots are cached and immutable; listeners detach on name changes", async () => {
  const ref = createRef<Leaflet.Map>()
  const snapshots: ReturnType<typeof useMapView>[] = []
  const events: string[] = []
  function Status({ listen }: { listen: boolean }) {
    const view = useMapView()
    snapshots.push(view)
    useMapEvents(
      listen
        ? {
            click: (e) => {
              expect(e.position).toBeUndefined()
              events.push("click")
            },
          }
        : { moveend: () => events.push("move") },
    )
    const [n, setN] = useState(0)
    return (
      <button type="button" onClick={() => setN(n + 1)}>
        {n}
      </button>
    )
  }
  await render(
    <MapContainer ref={ref}>
      <Status listen />
    </MapContainer>,
  )
  const before = snapshots.at(-1)!
  await click(document.querySelector("button")!)
  expect(snapshots.at(-1)).toBe(before)
  expect(Object.isFrozen(before)).toBe(true)
  expect(Object.isFrozen(before.center)).toBe(true)
  await render(
    <MapContainer ref={ref}>
      <Status listen={false} />
    </MapContainer>,
  )
  await act(async () => {
    ref.current!.fire("click")
    ref.current!.setView([2, 3], 5)
  })
  expect(events).not.toContain("click")
  await waitFor(() => expect(snapshots.at(-1)!.zoom).toBe(5))
})

test("event callbacks refresh without resubscribing and removed listeners stop firing", async () => {
  const ref = createRef<Leaflet.Map>()
  const calls: string[] = []
  const tree = (label: string, visible = true) => (
    <MapContainer ref={ref}>
      {visible && (
        <Marker
          position={[0, 0]}
          eventHandlers={{ click: () => calls.push(label) }}
        />
      )}
    </MapContainer>
  )
  // Check hook subscriptions on the map, independently of Leaflet layer updates.
  function Listener({ label }: { label: string }) {
    useMapEvents({ click: () => calls.push(label) })
    return null
  }
  await render(tree("layer"))
  const on = vi.spyOn(ref.current!, "on"),
    off = vi.spyOn(ref.current!, "off")
  await render(
    <MapContainer ref={ref}>
      <Listener label="first" />
    </MapContainer>,
  )
  on.mockClear()
  off.mockClear()
  await render(
    <MapContainer ref={ref}>
      <Listener label="second" />
    </MapContainer>,
  )
  expect(on).not.toHaveBeenCalled()
  expect(off).not.toHaveBeenCalled()
  await act(async () => {
    ref.current!.fire("click")
  })
  expect(calls).toEqual(["second"])
  await render(<MapContainer ref={ref} />)
  expect(off).toHaveBeenCalled()
  await act(async () => {
    ref.current!.fire("click")
  })
  expect(calls).toEqual(["second"])
})

test("layer and overlay classes update without replacing Leaflet classes", async () => {
  const ref = createRef<Leaflet.Marker>()
  const tree = (className?: string) => (
    <MapContainer>
      <Marker ref={ref} position={[0, 0]} className={className}>
        <ReleafMap.Popup open className={className}>
          Content
        </ReleafMap.Popup>
      </Marker>
      <ReleafMap.Toolbar>
        <ReleafMap.Actions.ZoomIn className="h-8">
          <button type="button" className="h-9 custom-button">
            Zoom
          </button>
        </ReleafMap.Actions.ZoomIn>
      </ReleafMap.Toolbar>
    </MapContainer>
  )
  await render(tree("first"))
  const marker = ref.current!
  expect(marker.getElement()!.classList.contains("first")).toBe(true)
  expect(marker.getPopup()!.getContent()).toHaveProperty("className", "first")
  expect(document.querySelector(".custom-button")!.className).toBe(
    "custom-button h-8",
  )
  await render(tree("second"))
  expect(ref.current).toBe(marker)
  expect(marker.getElement()!.classList.contains("first")).toBe(false)
  expect(marker.getElement()!.classList.contains("second")).toBe(true)
  expect(marker.getElement()!.classList.contains("leaflet-marker-icon")).toBe(
    true,
  )
  expect(marker.getPopup()!.getContent()).toHaveProperty("className", "second")
  await render(tree())
  expect(marker.getElement()!.classList.contains("second")).toBe(false)
})
