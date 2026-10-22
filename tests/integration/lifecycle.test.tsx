import { spawnSync } from "node:child_process"
import { readFile } from "node:fs/promises"
import type * as L from "leaflet"
import { Component, createRef, type ReactNode } from "react"
import { afterEach, expect, test, vi } from "vitest"
import { cleanup, observers, render, waitFor } from "./helpers"

afterEach(cleanup)

// biome-ignore lint/suspicious/noShadowRestrictedNames: Map is the public compound component API.
const { MapContainer, Marker, Popup, Tooltip, useMap, useLeaflet, Map } =
  await import("../../src/index")
class Boundary extends Component<
  { children: ReactNode },
  { error: string | null }
> {
  state: { error: string | null } = { error: null }
  static getDerivedStateFromError(error: Error) {
    return { error: error.message }
  }
  render() {
    return this.state.error ? (
      <output role="alert">{this.state.error}</output>
    ) : (
      this.props.children
    )
  }
}

test("maps run without ResizeObserver and expose live Leaflet to descendants", async () => {
  const observer = globalThis.ResizeObserver
  // @ts-expect-error ResizeObserver is optional at runtime
  delete globalThis.ResizeObserver
  const ref = createRef<L.Map>()
  function Probe() {
    const map = useMap()
    const leaflet = useLeaflet()
    return <output>{String(map instanceof leaflet.Map)}</output>
  }
  try {
    await render(
      <MapContainer ref={ref} aria-label="Custom map" className="h-[300px]">
        <Probe />
      </MapContainer>,
    )
    expect(ref.current).not.toBeNull()
    expect(document.querySelector("output")!.textContent).toBe("true")
    expect(
      document
        .querySelector('[aria-label="Custom map"]')!
        .getAttribute("class"),
    ).toBe("h-[300px]")
    expect(observers).toHaveLength(0)
  } finally {
    globalThis.ResizeObserver = observer
  }
})

test("creation errors, missing context and invalid standalone overlays reach boundaries", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {})
  function Outside() {
    useMap()
    return null
  }
  try {
    await render(
      <Boundary key="context">
        <Outside />
      </Boundary>,
    )
    expect(document.querySelector('[role="alert"]')!.textContent).toContain(
      "MapContainer",
    )
    await render(
      <Boundary key="creation">
        <MapContainer initialCenter={[NaN, 0]} />
      </Boundary>,
    )
    await waitFor(() =>
      expect(document.querySelector('[role="alert"]')!.textContent).toContain(
        "Invalid LatLng",
      ),
    )
    await render(
      <Boundary key="overlay">
        <MapContainer>
          <Popup>Missing position</Popup>
        </MapContainer>
      </Boundary>,
    )
    await waitFor(() =>
      expect(document.querySelector('[role="alert"]')!.textContent).toContain(
        "require a position",
      ),
    )
  } finally {
    log.mockRestore()
  }
})

test("nested popup and tooltip bindings detach while the parent survives", async () => {
  const ref = createRef<L.Marker>()
  const tree = (visible: boolean) => (
    <MapContainer>
      <Marker ref={ref} position={[0, 0]}>
        {visible && (
          <>
            <Popup>Popup</Popup>
            <Tooltip open>Tooltip</Tooltip>
          </>
        )}
      </Marker>
    </MapContainer>
  )
  await render(tree(true))
  const marker = ref.current!
  expect(marker.getPopup()).toBeDefined()
  expect(marker.isTooltipOpen()).toBe(true)
  await render(tree(false))
  expect(ref.current).toBe(marker)
  expect(marker.getPopup()).toBeNull()
  expect(marker.getTooltip()).toBeNull()
})

test("zoom limits restore when controls unmount", async () => {
  const ref = createRef<L.Map>()
  await render(<Map.Root ref={ref} options={{ minZoom: 2, maxZoom: 18 }} />)
  const map = ref.current!
  await render(
    <Map.Root ref={ref}>
      <Map.Zoom zoom={5} minZoom={3} maxZoom={10} />
    </Map.Root>,
  )
  expect(map.getMinZoom()).toBe(3)
  expect(map.getMaxZoom()).toBe(10)
  await render(<Map.Root ref={ref} />)
  expect(map.getMinZoom()).toBe(2)
  expect(map.getMaxZoom()).toBe(18)
})

test("both published entrypoints retain client directives and import without browser globals", async () => {
  for (const entry of ["index", "events"]) {
    const code = await readFile(`dist/${entry}.js`, "utf8")
    expect(code.startsWith('"use client"')).toBe(true)
    const result = spawnSync(
      process.execPath,
      [
        "-e",
        `await import("releaf${entry === "events" ? "/events" : ""}"); if (typeof window !== "undefined") throw Error("browser global");`,
      ],
      { cwd: process.cwd() },
    )
    expect(result.error).toBeUndefined()
    expect(result.status).toBe(0)
    expect(result.stderr.toString()).toBe("")
  }
})

test("changing layer refs preserves the instance; changing its key recreates options", async () => {
  const first: Array<L.Marker | null> = [],
    second: Array<L.Marker | null> = []
  const initialRef = (value: L.Marker | null) => {
    first.push(value)
  }
  const nextRef = (value: L.Marker | null) => {
    second.push(value)
  }
  const tree = (changed: boolean, key: number) => (
    <MapContainer>
      <Marker
        key={key}
        ref={changed ? nextRef : initialRef}
        position={[1, 2]}
        options={{ title: changed ? "new" : "initial" }}
      />
    </MapContainer>
  )
  await render(tree(false, 1))
  const marker = first.at(-1)!
  await render(tree(true, 1))
  expect(first.at(-1)).toBeNull()
  expect(second.at(-1)).toBe(marker)
  expect(marker.options.title).toBe("initial")
  await render(tree(true, 2))
  expect(second.at(-1)).not.toBe(marker)
  expect(second.at(-1)!.options.title).toBe("new")
})

test("standalone tooltips update position and close without replacing the map", async () => {
  const ref = createRef<L.Map>()
  const tree = (updated: boolean, open = true) => (
    <MapContainer ref={ref}>
      <Tooltip position={updated ? [1, 2] : [0, 0]} open={open}>
        {updated ? "Updated" : "Initial"}
      </Tooltip>
    </MapContainer>
  )
  await render(tree(false))
  let tooltip!: L.Tooltip
  ref.current!.eachLayer((layer) => {
    if ("getContent" in layer) tooltip = layer as L.Tooltip
  })
  expect(tooltip.getLatLng()!.equals([0, 0])).toBe(true)
  await render(tree(true))
  expect(tooltip.getLatLng()!.equals([1, 2])).toBe(true)
  expect(document.querySelector(".leaflet-tooltip")!.textContent).toBe(
    "Updated",
  )
  await render(tree(true, false))
  expect(ref.current!.hasLayer(tooltip)).toBe(false)
})
