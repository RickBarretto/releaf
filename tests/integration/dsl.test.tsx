import type * as L from "leaflet"
import { act, createRef, StrictMode } from "react"
import { afterEach, describe, expect, test } from "vitest"
import { cleanup, dom, render, waitFor } from "./helpers"

// Test the published bundle, including its external imports and client boundary.
afterEach(cleanup)

// biome-ignore lint/suspicious/noShadowRestrictedNames: Map is the public compound component API.
const { Map } = await import("../../src/index")

describe("Map DSL", () => {
  test("attribution defaults, overrides, and restores live provider credits", async () => {
    const mapRef = createRef<L.Map>()
    const tree = (custom: boolean) => (
      <Map.Root ref={mapRef}>
        <Map.Tiles.OpenStreetMap />
        {custom && (
          <Map.Attribution
            top
            left
            prefix="Custom credits"
            className="custom-attribution"
          />
        )}
      </Map.Root>
    )
    await render(tree(false))
    const footer = () => document.querySelector('[data-slot="map-footer"]')!
    await waitFor(() => expect(footer()).not.toBeNull())
    expect(footer().textContent).toContain("{Re}leaf")
    expect(footer().textContent).toContain("OpenStreetMap")
    await render(tree(true))
    expect(
      document.querySelectorAll(".leaflet-control-attribution"),
    ).toHaveLength(1)
    expect(footer().textContent).toContain("Custom credits")
    expect(footer().textContent).toContain("OpenStreetMap")
    expect(footer().classList.contains("custom-attribution")).toBe(true)
    expect(mapRef.current!.attributionControl.getPosition()).toBe("topleft")
    await render(tree(false))
    expect(footer().textContent).toContain("{Re}leaf")
    expect(footer().classList.contains("custom-attribution")).toBe(false)
    expect(mapRef.current!.attributionControl.getPosition()).toBe("bottomright")
    expect(Map.Attributtion).toBe(Map.Attribution)
  })

  test("composes view, tiles, positions, controls with cleanup", async () => {
    const mapRef = createRef<L.Map>()
    const markerRef = createRef<L.Marker>()
    function Controls() {
      return (
        <Map.Toolbar bottom left data-testid="toolbar">
          <Map.Actions.ZoomIn />
          <Map.Actions.FlyTo position={{ latitude: 5, longitude: 6 }} zoom={8}>
            <button type="button">Home</button>
          </Map.Actions.FlyTo>
        </Map.Toolbar>
      )
    }
    const tree = () => (
      <StrictMode>
        <Map.Root ref={mapRef} options={{ zoomAnimation: false }}>
          <Map.View position={{ latitude: 1, longitude: 2 }} animate={false} />
          <Map.Zoom zoom={7} minZoom={3} maxZoom={19} />
          <Map.Tiles.OpenStreetMap />
          <Map.Marker ref={markerRef} position={{ latitude: 1, longitude: 2 }}>
            <Map.Popup>Home</Map.Popup>
          </Map.Marker>
          <Controls />
        </Map.Root>
      </StrictMode>
    )
    await render(tree())
    const map = mapRef.current!
    expect(map.getCenter().distanceTo([1, 2])).toBeLessThan(1000)
    expect(map.getZoom()).toBe(7)
    expect(markerRef.current!.getLatLng().equals([1, 2])).toBe(true)
    expect(
      document.querySelector(
        ".leaflet-bottom.leaflet-left [data-testid=toolbar]",
      ),
    ).not.toBeNull()
    const zoom = document.querySelector(
      '[data-testid="toolbar"] [aria-label="Zoom in"]',
    )!
    expect(zoom.getAttribute("data-slot")).toBe("button")
    expect(document.querySelector("button")?.querySelector("button")).toBeNull()
    await act(async () => {
      zoom.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }))
    })
    expect(map.getZoom()).toBe(8)
    await render(<Map.Root ref={mapRef} />)
    expect(document.querySelector("[data-testid=toolbar]")).toBeNull()
  })

  test("events entry shares map context and exposes positions with fresh callbacks", async () => {
    const { useMapEvents: useEvents } = await import("../../src/events")
    const mapRef = createRef<L.Map>()
    const calls: unknown[] = []
    function Listener({ label }: { label: string }) {
      useEvents({ click: (event) => calls.push([label, event.position]) })
      return null
    }
    const tree = (label: string) => (
      <Map.Root ref={mapRef}>
        <Listener label={label} />
      </Map.Root>
    )
    await render(tree("first"))
    await act(async () => {
      mapRef.current!.fire("click", { latlng: { lat: 1, lng: 2 } })
    })
    await render(tree("second"))
    await act(async () => {
      mapRef.current!.fire("click", { latlng: { lat: 3, lng: 4 } })
    })
    expect(calls).toEqual([
      ["first", { latitude: 1, longitude: 2 }],
      ["second", { latitude: 3, longitude: 4 }],
    ])
  })

  test("search ignores stale responses and selects using keyboard", async () => {
    const pending = new globalThis.Map<
      string,
      (places: { label: string }[]) => void
    >()
    const selected: unknown[] = []
    const search = (query: string) =>
      new Promise<{ label: string }[]>((resolve) => pending.set(query, resolve))
    await render(
      <Map.SearchBar
        search={search}
        onSelect={(place) => selected.push(place)}
        debounceMs={0}
      >
        <Map.SearchBar.Input />
        <Map.SearchBar.Results />
      </Map.SearchBar>,
    )
    const input = document.querySelector("input")!
    async function type(value: string) {
      await act(async () => {
        Object.getOwnPropertyDescriptor(
          dom.window.HTMLInputElement.prototype,
          "value",
        )!.set!.call(input, value)
        input.dispatchEvent(new dom.window.Event("input", { bubbles: true }))
      })
      await waitFor(() => expect(pending.has(value)).toBe(true))
    }
    await type("old")
    await type("new")
    await act(async () => {
      pending.get("new")!([{ label: "New place" }])
    })
    await act(async () => {
      pending.get("old")!([{ label: "Old place" }])
    })
    expect(document.querySelector('[role="option"]')!.textContent).toBe(
      "New place",
    )
    await act(async () => {
      input.dispatchEvent(
        new dom.window.KeyboardEvent("keydown", {
          key: "ArrowDown",
          bubbles: true,
        }),
      )
    })
    await act(async () => {
      input.dispatchEvent(
        new dom.window.KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: true,
        }),
      )
    })
    expect(selected).toEqual([{ label: "New place" }])
    expect(input.value).toBe("New place")
  })
})
