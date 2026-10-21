import type * as L from "leaflet"
import { act, createRef, StrictMode } from "react"
import { afterEach, describe, expect, test } from "vitest"
import { cleanup, dom, render, waitFor } from "./helpers"

// Test the published bundle, including its external imports and client boundary.
afterEach(cleanup)

const { Map: ReleafMap } = await import("../../src/index")

describe("Map DSL", () => {
  test("composes view, tiles, positions, controls with cleanup", async () => {
    const mapRef = createRef<L.Map>()
    const markerRef = createRef<L.Marker>()
    function Controls() {
      return (
        <ReleafMap.Toolbar bottom left data-testid="toolbar">
          <ReleafMap.Actions.ZoomIn />
          <ReleafMap.Actions.FlyTo
            position={{ latitude: 5, longitude: 6 }}
            zoom={8}
          >
            <button type="button">Home</button>
          </ReleafMap.Actions.FlyTo>
        </ReleafMap.Toolbar>
      )
    }
    const tree = () => (
      <StrictMode>
        <ReleafMap.Root ref={mapRef} options={{ zoomAnimation: false }}>
          <ReleafMap.View
            position={{ latitude: 1, longitude: 2 }}
            animate={false}
          />
          <ReleafMap.Zoom zoom={7} minZoom={3} maxZoom={19} />
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
    await render(<ReleafMap.Root ref={mapRef} />)
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
      <ReleafMap.Root ref={mapRef}>
        <Listener label={label} />
      </ReleafMap.Root>
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
      <ReleafMap.SearchBar
        search={search}
        onSelect={(place) => selected.push(place)}
        debounceMs={0}
      >
        <ReleafMap.SearchBar.Input />
        <ReleafMap.SearchBar.Results />
      </ReleafMap.SearchBar>,
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
