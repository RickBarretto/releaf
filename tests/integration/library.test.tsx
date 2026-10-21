import { afterEach, describe, expect, test } from "bun:test"
import type * as L from "leaflet"
import {
  act,
  createContext,
  createRef,
  StrictMode,
  useContext,
  useState,
} from "react"
import { cleanup, dom, observers, render, unmount } from "./helpers"

// Test the published bundle, including its external imports and client boundary.
afterEach(cleanup)

const {
  MapContainer,
  MapView,
  Marker,
  TileLayer,
  Circle,
  CircleMarker,
  Polyline,
  Polygon,
  Rectangle,
  LayerGroup,
  FeatureGroup,
  GeoJSON,
  ImageOverlay,
  Popup,
  Tooltip,
  useMap,
  useMapEvents,
  useMapView,
} = await import("../../dist/index.js")

describe("Releaf", () => {
  test("imports and renders on the server without browser globals", () => {
    const result = Bun.spawnSync(
      [
        process.execPath,
        "-e",
        `
      import { createElement } from "react";
      import { renderToString } from "react-dom/server";
      import { MapContainer, Marker } from "./dist/index.js";
      if (typeof window !== "undefined") throw Error("Unexpected browser global");
      console.log(renderToString(createElement(MapContainer, { "aria-label": "Map", fallback: "Loading map" }, createElement(Marker, {position:[0,0]}))));
    `,
      ],
      { cwd: process.cwd() },
    )
    expect(result.exitCode).toBe(0)
    expect(result.stdout.toString()).toContain('aria-label="Map"')
    expect(result.stdout.toString()).toContain("Loading map")
    expect(result.stderr.toString()).toBe("")
  })

  test("survives Strict Mode, updates instances, and cleans up map, layers, refs, and observers", async () => {
    const mapRef = createRef<L.Map>()
    const markerRef = createRef<L.Marker>()
    const tileRef = createRef<L.TileLayer>()
    const circleRef = createRef<L.Circle>()
    const tree = (updated: boolean) => (
      <StrictMode>
        <MapContainer
          ref={mapRef}
          options={{ zoomAnimation: false, fadeAnimation: false }}
        >
          <MapView
            center={updated ? [10, 20] : [0, 0]}
            zoom={updated ? 7 : 2}
          />
          <TileLayer
            ref={tileRef}
            url="https://tiles.invalid/{z}/{x}/{y}.png"
            opacity={updated ? 0.4 : 1}
          />
          <Marker
            ref={markerRef}
            position={updated ? [10, 20] : [1, 2]}
            draggable={updated}
          />
          <Circle
            ref={circleRef}
            center={updated ? [3, 4] : [1, 2]}
            radius={updated ? 200 : 100}
            pathOptions={{ color: updated ? "red" : "blue" }}
          />
          <CircleMarker center={[2, 3]} />
          <Polyline
            positions={[
              [0, 0],
              [1, 1],
            ]}
          />
          <Polygon
            positions={[
              [0, 0],
              [0, 1],
              [1, 1],
            ]}
          />
          <Rectangle
            bounds={[
              [0, 0],
              [1, 1],
            ]}
          />
        </MapContainer>
      </StrictMode>
    )
    await render(tree(false))
    const map = mapRef.current!
    const marker = markerRef.current!
    expect(map.getZoom()).toBe(2)
    expect(marker.getLatLng().lat).toBe(1)
    expect(document.querySelectorAll(".leaflet-container")).toHaveLength(1)
    await render(tree(true))
    expect(mapRef.current).toBe(map)
    expect(markerRef.current).toBe(marker)
    expect(map.getCenter().equals([10, 20])).toBe(true)
    expect(map.getZoom()).toBe(7)
    expect(marker.getLatLng().equals([10, 20])).toBe(true)
    expect(marker.dragging?.enabled()).toBe(true)
    expect(tileRef.current!.options.opacity).toBe(0.4)
    expect(circleRef.current!.getLatLng().equals([3, 4])).toBe(true)
    expect(circleRef.current!.getRadius()).toBe(200)
    expect(circleRef.current!.options.color).toBe("red")
    let removed = false
    map.on("unload", () => {
      removed = true
    })
    await unmount()
    expect(removed).toBe(true)
    expect(map.hasLayer(marker)).toBe(false)
    expect(mapRef.current).toBeNull()
    expect(markerRef.current).toBeNull()
    expect(observers.every((observer) => observer.disconnected)).toBe(true)
  })

  test("event handlers see current props, detach, and external snapshots update", async () => {
    const mapRef = createRef<L.Map>()
    const calls: string[] = []
    function Status({ label, listen }: { label: string; listen: boolean }) {
      const map = useMap()
      useMapEvents(
        listen
          ? {
              click: () => {
                calls.push(label)
              },
            }
          : {},
      )
      const view = useMapView()
      return (
        <output data-zoom={view.zoom}>
          {view.center.join(",")}
          {map === mapRef.current ? " ready" : ""}
        </output>
      )
    }
    const tree = (label: string, listen = true) => (
      <MapContainer ref={mapRef} options={{ zoomAnimation: false }}>
        <Status label={label} listen={listen} />
      </MapContainer>
    )
    await render(tree("before"))
    await act(async () => {
      mapRef.current!.fire("click")
    })
    await render(tree("after"))
    await act(async () => {
      mapRef.current!.fire("click")
      mapRef.current!.setView([3, 4], 5)
    })
    expect(calls).toEqual(["before", "after"])
    expect(document.querySelector("output")!.dataset.zoom).toBe("5")
    expect(document.querySelector("output")!.textContent).toContain("3,4")
    await render(tree("disabled", false))
    await act(async () => {
      mapRef.current!.fire("click")
    })
    expect(calls).toHaveLength(2)
  })

  test("popup portals preserve React state and context and update content", async () => {
    const Theme = createContext("default")
    const markerRef = createRef<L.Marker>()
    function Content({ label }: { label: string }) {
      const [count, setCount] = useState(0)
      const theme = useContext(Theme)
      return (
        <button type="button" onClick={() => setCount(count + 1)}>
          {label} {theme} {count}
        </button>
      )
    }
    const tree = (label: string, open = true) => (
      <Theme value="dark">
        <MapContainer options={{ zoomAnimation: false }}>
          <Marker ref={markerRef} position={[0, 0]}>
            <Popup open={open}>
              <Content label={label} />
            </Popup>
            <Tooltip options={{ permanent: true }}>Marker label</Tooltip>
          </Marker>
        </MapContainer>
      </Theme>
    )
    await render(tree("Hello"))
    expect(markerRef.current!.isPopupOpen()).toBe(true)
    const button = document.querySelector(".leaflet-popup button")!
    expect(button.textContent).toBe("Hello dark 0")
    await act(async () => {
      button.dispatchEvent(
        new dom.window.MouseEvent("click", { bubbles: true }),
      )
    })
    expect(button.textContent).toBe("Hello dark 1")
    await render(tree("Updated"))
    expect(document.querySelector(".leaflet-popup button")!.textContent).toBe(
      "Updated dark 1",
    )
    await render(tree("Updated", false))
    expect(markerRef.current!.isPopupOpen()).toBe(false)
  })

  test("nested groups remove unmounted children from their collection", async () => {
    const groupRef = createRef<L.LayerGroup>()
    const featureRef = createRef<L.FeatureGroup>()
    const markerRef = createRef<L.Marker>()
    const tree = (visible: boolean) => (
      <StrictMode>
        <MapContainer>
          <LayerGroup ref={groupRef}>
            <FeatureGroup ref={featureRef}>
              {visible && <Marker ref={markerRef} position={[1, 2]} />}
            </FeatureGroup>
          </LayerGroup>
        </MapContainer>
      </StrictMode>
    )
    await render(tree(true))
    const marker = markerRef.current!
    expect(groupRef.current!.hasLayer(featureRef.current!)).toBe(true)
    expect(featureRef.current!.hasLayer(marker)).toBe(true)
    await render(tree(false))
    expect(featureRef.current!.getLayers()).toHaveLength(0)
    expect(markerRef.current).toBeNull()
    await render(tree(true))
    expect(featureRef.current!.getLayers()).toHaveLength(1)
  })

  test("GeoJSON replaces features and image overlays update in place", async () => {
    const geoRef = createRef<L.GeoJSON>()
    const imageRef = createRef<L.ImageOverlay>()
    const tree = (updated: boolean) => (
      <MapContainer>
        <GeoJSON
          ref={geoRef}
          data={
            {
              type: "Feature",
              properties: { id: updated ? 2 : 1 },
              geometry: {
                type: "LineString",
                coordinates: [
                  [0, 0],
                  [1, 1],
                ],
              },
            } as import("geojson").Feature
          }
          pathOptions={{ color: updated ? "red" : "blue" }}
        />
        <ImageOverlay
          ref={imageRef}
          url={updated ? "second.png" : "first.png"}
          bounds={
            updated
              ? [
                  [1, 2],
                  [3, 4],
                ]
              : [
                  [0, 0],
                  [1, 1],
                ]
          }
          opacity={updated ? 0.2 : 1}
        />
      </MapContainer>
    )
    await render(tree(false))
    const geo = geoRef.current!
    const image = imageRef.current!
    expect(geo.getLayers()).toHaveLength(1)
    await render(tree(true))
    expect(geoRef.current).toBe(geo)
    expect(geo.getLayers()).toHaveLength(1)
    expect((geo.getLayers()[0] as L.Polyline).options.color).toBe("red")
    expect(
      (geo.toGeoJSON() as { features: Array<{ properties: { id: number } }> })
        .features[0].properties.id,
    ).toBe(2)
    expect(imageRef.current).toBe(image)
    expect(image.getBounds().getSouthWest().equals([1, 2])).toBe(true)
    expect(image.options.opacity).toBe(0.2)
    expect(image.getElement()!.src).toContain("second.png")
  })

  test("removing mutable styles restores Leaflet defaults while options stay creation-only", async () => {
    const circleRef = createRef<L.CircleMarker>()
    const tileRef = createRef<L.TileLayer>()
    const tree = (updated: boolean) => (
      <MapContainer>
        <CircleMarker
          ref={circleRef}
          center={[0, 0]}
          radius={updated ? 20 : 8}
          pathOptions={updated ? {} : { color: "red", weight: 9 }}
        />
        <TileLayer
          ref={tileRef}
          url="https://tiles.invalid/{z}/{x}/{y}.png"
          options={{ opacity: updated ? 0.2 : 0.8 }}
          opacity={updated ? undefined : 0.5}
        />
      </MapContainer>
    )
    await render(tree(false))
    expect(circleRef.current!.options.color).toBe("red")
    await render(tree(true))
    expect(circleRef.current!.options.color).toBe("#3388ff")
    expect(circleRef.current!.options.weight).toBe(3)
    expect(circleRef.current!.getRadius()).toBe(20)
    expect(tileRef.current!.options.opacity).toBe(0.8)
  })

  test("standalone overlays move and close declaratively", async () => {
    const mapRef = createRef<L.Map>()
    const tree = (open: boolean) => (
      <MapContainer ref={mapRef}>
        <Popup position={open ? [1, 2] : [3, 4]} open={open}>
          Standalone
        </Popup>
      </MapContainer>
    )
    await render(tree(true))
    expect(document.querySelector(".leaflet-popup-content")!.textContent).toBe(
      "Standalone",
    )
    await render(tree(false))
    expect(document.querySelector(".leaflet-popup")).toBeNull()
  })
})
