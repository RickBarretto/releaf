import { afterEach, describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import type * as L from "leaflet";
import type { ReactNode } from "react";
import {
  act,
  createContext,
  createRef,
  StrictMode,
  useContext,
  useState,
} from "react";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  SVGElement: dom.window.SVGElement,
  getComputedStyle: dom.window.getComputedStyle,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(dom.window.SVGSVGElement.prototype, "createSVGRect", {
  value: () => ({}),
});
Object.defineProperty(dom.window.HTMLElement.prototype, "clientWidth", {
  get: () => 800,
});
Object.defineProperty(dom.window.HTMLElement.prototype, "clientHeight", {
  get: () => 400,
});

const observers: Array<{ disconnected: boolean; callback: () => void }> = [];
globalThis.ResizeObserver = class {
  entry = { disconnected: false, callback: () => this.callback() };
  constructor(private callback: () => void) {
    observers.push(this.entry);
  }
  observe() {}
  unobserve() {}
  disconnect() {
    this.entry.disconnected = true;
  }
} as unknown as typeof ResizeObserver;

const { createRoot } = await import("react-dom/client");
// Test the published bundle, including its external imports and client boundary.
const {
  Map: ReleafMap,
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
} = await import("../dist/index.js");

let root: ReturnType<typeof createRoot> | undefined;
let host: HTMLDivElement;
async function render(node: ReactNode) {
  if (!root) {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  }
  await act(async () => {
    root!.render(node);
  });
  // Leaflet is intentionally loaded asynchronously after the DOM commits.
  for (let i = 0; i < 6; i++)
    await act(async () => {
      await Bun.sleep(5);
    });
}

afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined;
  document.body.innerHTML = "";
  observers.length = 0;
});

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
    );
    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toContain('aria-label="Map"');
    expect(result.stdout.toString()).toContain("Loading map");
    expect(result.stderr.toString()).toBe("");
  });

  test("survives Strict Mode, updates instances, and cleans up map, layers, refs, and observers", async () => {
    const mapRef = createRef<L.Map>();
    const markerRef = createRef<L.Marker>();
    const tileRef = createRef<L.TileLayer>();
    const circleRef = createRef<L.Circle>();
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
            center={[1, 2]}
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
    );
    await render(tree(false));
    const map = mapRef.current!;
    const marker = markerRef.current!;
    expect(map.getZoom()).toBe(2);
    expect(marker.getLatLng().lat).toBe(1);
    expect(document.querySelectorAll(".leaflet-container")).toHaveLength(1);
    await render(tree(true));
    expect(mapRef.current).toBe(map);
    expect(markerRef.current).toBe(marker);
    expect(map.getCenter().equals([10, 20])).toBe(true);
    expect(map.getZoom()).toBe(7);
    expect(marker.getLatLng().equals([10, 20])).toBe(true);
    expect(marker.dragging?.enabled()).toBe(true);
    expect(tileRef.current!.options.opacity).toBe(0.4);
    expect(circleRef.current!.getRadius()).toBe(200);
    expect(circleRef.current!.options.color).toBe("red");
    let removed = false;
    map.on("unload", () => {
      removed = true;
    });
    await act(async () => root!.unmount());
    root = undefined;
    expect(removed).toBe(true);
    expect(map.hasLayer(marker)).toBe(false);
    expect(mapRef.current).toBeNull();
    expect(markerRef.current).toBeNull();
    expect(observers.every((observer) => observer.disconnected)).toBe(true);
  });

  test("event handlers see current props, detach, and external snapshots update", async () => {
    const mapRef = createRef<L.Map>();
    const calls: string[] = [];
    function Status({ label, listen }: { label: string; listen: boolean }) {
      const map = useMap();
      useMapEvents(
        listen
          ? {
              click: () => {
                calls.push(label);
              },
            }
          : {},
      );
      const view = useMapView();
      return (
        <output data-zoom={view.zoom}>
          {view.center.join(",")}
          {map === mapRef.current ? " ready" : ""}
        </output>
      );
    }
    const tree = (label: string, listen = true) => (
      <MapContainer ref={mapRef} options={{ zoomAnimation: false }}>
        <Status label={label} listen={listen} />
      </MapContainer>
    );
    await render(tree("before"));
    await act(async () => {
      mapRef.current!.fire("click");
    });
    await render(tree("after"));
    await act(async () => {
      mapRef.current!.fire("click");
      mapRef.current!.setView([3, 4], 5);
    });
    expect(calls).toEqual(["before", "after"]);
    expect(document.querySelector("output")!.dataset.zoom).toBe("5");
    expect(document.querySelector("output")!.textContent).toContain("3,4");
    await render(tree("disabled", false));
    await act(async () => {
      mapRef.current!.fire("click");
    });
    expect(calls).toHaveLength(2);
  });

  test("popup portals preserve React state and context and update content", async () => {
    const Theme = createContext("default");
    const markerRef = createRef<L.Marker>();
    function Content({ label }: { label: string }) {
      const [count, setCount] = useState(0);
      const theme = useContext(Theme);
      return (
        <button type="button" onClick={() => setCount(count + 1)}>
          {label} {theme} {count}
        </button>
      );
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
    );
    await render(tree("Hello"));
    expect(markerRef.current!.isPopupOpen()).toBe(true);
    const button = document.querySelector(".leaflet-popup button")!;
    expect(button.textContent).toBe("Hello dark 0");
    await act(async () => {
      button.dispatchEvent(
        new dom.window.MouseEvent("click", { bubbles: true }),
      );
    });
    expect(button.textContent).toBe("Hello dark 1");
    await render(tree("Updated"));
    expect(document.querySelector(".leaflet-popup button")!.textContent).toBe(
      "Updated dark 1",
    );
    await render(tree("Updated", false));
    expect(markerRef.current!.isPopupOpen()).toBe(false);
  });

  test("nested groups remove unmounted children from their collection", async () => {
    const groupRef = createRef<L.LayerGroup>();
    const featureRef = createRef<L.FeatureGroup>();
    const markerRef = createRef<L.Marker>();
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
    );
    await render(tree(true));
    const marker = markerRef.current!;
    expect(groupRef.current!.hasLayer(featureRef.current!)).toBe(true);
    expect(featureRef.current!.hasLayer(marker)).toBe(true);
    await render(tree(false));
    expect(featureRef.current!.getLayers()).toHaveLength(0);
    expect(markerRef.current).toBeNull();
    await render(tree(true));
    expect(featureRef.current!.getLayers()).toHaveLength(1);
  });

  test("GeoJSON replaces features and image overlays update in place", async () => {
    const geoRef = createRef<L.GeoJSON>();
    const imageRef = createRef<L.ImageOverlay>();
    const tree = (updated: boolean) => (
      <MapContainer>
        <GeoJSON
          ref={geoRef}
          data={{
            type: "Feature",
            properties: { id: updated ? 2 : 1 },
            geometry: {
              type: "LineString",
              coordinates: [
                [0, 0],
                [1, 1],
              ],
            },
          }}
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
    );
    await render(tree(false));
    const geo = geoRef.current!;
    const image = imageRef.current!;
    expect(geo.getLayers()).toHaveLength(1);
    await render(tree(true));
    expect(geoRef.current).toBe(geo);
    expect(geo.getLayers()).toHaveLength(1);
    expect((geo.getLayers()[0] as L.Polyline).options.color).toBe("red");
    expect(
      (geo.toGeoJSON() as { features: Array<{ properties: { id: number } }> })
        .features[0].properties.id,
    ).toBe(2);
    expect(imageRef.current).toBe(image);
    expect(image.getBounds().getSouthWest().equals([1, 2])).toBe(true);
    expect(image.options.opacity).toBe(0.2);
    expect(image.getElement()!.src).toContain("second.png");
  });

  test("removing mutable styles restores Leaflet defaults while options stay creation-only", async () => {
    const circleRef = createRef<L.CircleMarker>();
    const tileRef = createRef<L.TileLayer>();
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
    );
    await render(tree(false));
    expect(circleRef.current!.options.color).toBe("red");
    await render(tree(true));
    expect(circleRef.current!.options.color).toBe("#3388ff");
    expect(circleRef.current!.options.weight).toBe(3);
    expect(circleRef.current!.getRadius()).toBe(20);
    expect(tileRef.current!.options.opacity).toBe(0.8);
  });

  test("standalone overlays move and close declaratively", async () => {
    const mapRef = createRef<L.Map>();
    const tree = (open: boolean) => (
      <MapContainer ref={mapRef}>
        <Popup position={open ? [1, 2] : [3, 4]} open={open}>
          Standalone
        </Popup>
      </MapContainer>
    );
    await render(tree(true));
    expect(document.querySelector(".leaflet-popup-content")!.textContent).toBe(
      "Standalone",
    );
    await render(tree(false));
    expect(document.querySelector(".leaflet-popup")).toBeNull();
  });
});

describe("Map DSL", () => {
  test("composes view, tiles, positions, controls and rotation with cleanup", async () => {
    const mapRef = createRef<L.Map>();
    const markerRef = createRef<L.Marker>();
    let controller: ReturnType<typeof ReleafMap.useController>;
    function Controls() {
      controller = ReleafMap.useController();
      return (
        <ReleafMap.Toolbar bottom left data-testid="toolbar">
          <ReleafMap.Actions.ZoomIn />
          <ReleafMap.Actions.FlyTo
            position={{ latitude: 5, longitude: 6 }}
            zoom={8}
          >
            <button type="button">Home</button>
          </ReleafMap.Actions.FlyTo>
          <ReleafMap.Actions.ResetNorth />
        </ReleafMap.Toolbar>
      );
    }
    const tree = (enabled: boolean) => (
      <StrictMode>
        <ReleafMap.Root ref={mapRef} options={{ zoomAnimation: false }}>
          <ReleafMap.View position={{ latitude: 1, longitude: 2 }} />
          <ReleafMap.Zoom zoom={7} minZoom={3} maxZoom={19} />
          <ReleafMap.Rotation enabled={enabled} />
          <ReleafMap.Tiles.OpenStreetMap />
          <ReleafMap.Marker
            ref={markerRef}
            position={{ latitude: 1, longitude: 2 }}
          >
            <ReleafMap.Popup>Home</ReleafMap.Popup>
          </ReleafMap.Marker>
          <Controls />
        </ReleafMap.Root>
      </StrictMode>
    );
    await render(tree(true));
    const map = mapRef.current!;
    expect(map.getCenter().distanceTo([1, 2])).toBeLessThan(1000);
    expect(map.getZoom()).toBe(7);
    expect(markerRef.current!.getLatLng().equals([1, 2])).toBe(true);
    expect(
      document.querySelector(
        ".leaflet-bottom.leaflet-left [data-testid=toolbar]",
      ),
    ).not.toBeNull();
    const zoom = document.querySelector('[aria-label="Zoom in"]')!;
    await act(async () => {
      zoom.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    });
    expect(map.getZoom()).toBe(8);
    await act(async () => {
      controller!.rotateBy(45);
    });
    expect(map.getPane("mapPane")!.style.rotate).toBe("45deg");
    const point = map.latLngToContainerPoint([2, 3]);
    expect(map.containerPointToLatLng(point).distanceTo([2, 3])).toBeLessThan(
      1000,
    );
    await render(tree(false));
    expect(map.getPane("mapPane")!.style.rotate).toBe("0deg");
    await render(<ReleafMap.Root ref={mapRef} />);
    expect(document.querySelector("[data-testid=toolbar]")).toBeNull();
  });

  test("events entry shares map context and exposes positions with fresh callbacks", async () => {
    const { useMapEvents: useEvents } = await import("../dist/events.js");
    const mapRef = createRef<L.Map>();
    const calls: unknown[] = [];
    function Listener({ label }: { label: string }) {
      useEvents({ click: (event) => calls.push([label, event.position]) });
      return null;
    }
    const tree = (label: string) => (
      <ReleafMap.Root ref={mapRef}>
        <Listener label={label} />
      </ReleafMap.Root>
    );
    await render(tree("first"));
    await act(async () => {
      mapRef.current!.fire("click", { latlng: { lat: 1, lng: 2 } });
    });
    await render(tree("second"));
    await act(async () => {
      mapRef.current!.fire("click", { latlng: { lat: 3, lng: 4 } });
    });
    expect(calls).toEqual([
      ["first", { latitude: 1, longitude: 2 }],
      ["second", { latitude: 3, longitude: 4 }],
    ]);
  });

  test("search ignores stale responses and selects using keyboard", async () => {
    const pending = new globalThis.Map<
      string,
      (places: { label: string }[]) => void
    >();
    const selected: unknown[] = [];
    const search = (query: string) =>
      new Promise<{ label: string }[]>((resolve) =>
        pending.set(query, resolve),
      );
    await render(
      <ReleafMap.SearchBar
        search={search}
        onSelect={(place) => selected.push(place)}
        debounceMs={0}
      >
        <ReleafMap.SearchBar.Input />
        <ReleafMap.SearchBar.Results />
      </ReleafMap.SearchBar>,
    );
    const input = document.querySelector("input")!;
    async function type(value: string) {
      await act(async () => {
        Object.getOwnPropertyDescriptor(
          dom.window.HTMLInputElement.prototype,
          "value",
        )!.set!.call(input, value);
        input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
      });
      await act(async () => {
        await Bun.sleep(5);
      });
    }
    await type("old");
    await type("new");
    await act(async () => {
      pending.get("new")!([{ label: "New place" }]);
    });
    await act(async () => {
      pending.get("old")!([{ label: "Old place" }]);
    });
    expect(document.querySelector('[role="option"]')!.textContent).toBe(
      "New place",
    );
    await act(async () => {
      input.dispatchEvent(
        new dom.window.KeyboardEvent("keydown", {
          key: "ArrowDown",
          bubbles: true,
        }),
      );
    });
    await act(async () => {
      input.dispatchEvent(
        new dom.window.KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: true,
        }),
      );
    });
    expect(selected).toEqual([{ label: "New place" }]);
    expect(input.value).toBe("New place");
  });
});
