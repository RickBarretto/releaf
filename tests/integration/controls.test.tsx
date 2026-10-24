import type * as L from "leaflet"
import { act, createRef, useState } from "react"
import { afterEach, expect, test, vi } from "vitest"
import {
  Map as ReleafMap,
  useLocationPicker,
  useLocationRequest,
} from "../../src/index"
import { cleanup, click, render, type, waitFor } from "./helpers"

afterEach(async () => {
  await cleanup()
  vi.unstubAllGlobals()
})

test("location requests ignore obsolete successes, failures, resets and unmounts", async () => {
  const callbacks: {
    success: PositionCallback
    failure: PositionErrorCallback
  }[] = []
  vi.stubGlobal("navigator", {
    userAgent: "Mozilla/5.0",
    platform: "Linux",
    geolocation: {
      getCurrentPosition: (
        success: PositionCallback,
        failure: PositionErrorCallback,
      ) => callbacks.push({ success, failure }),
    },
  })
  let location!: ReturnType<typeof useLocationRequest>
  function Probe() {
    location = useLocationRequest()
    return <p>{location.status}</p>
  }
  await render(<Probe />)
  const onError = vi.fn()
  let first!: Promise<unknown>
  let second!: Promise<unknown>
  await act(async () => {
    first = location.request(undefined, onError)
    second = location.request(undefined, onError)
  })
  await act(async () =>
    callbacks[0].success({
      coords: { latitude: 1, longitude: 2 },
    } as GeolocationPosition),
  )
  expect(await first).toBeNull()
  expect(location.status).toBe("pending")
  await act(async () =>
    callbacks[1].failure({ message: "Denied" } as GeolocationPositionError),
  )
  expect(await second).toBeNull()
  if (location.status !== "error") throw new Error("Expected failure")
  expect(location.error.message).toBe("Denied")
  expect(onError).toHaveBeenCalledExactlyOnceWith(location.error)
  await act(async () => {
    first = location.request(undefined, onError)
    location.reset()
  })
  await act(async () =>
    callbacks[2].success({
      coords: { latitude: 1, longitude: 2 },
    } as GeolocationPosition),
  )
  expect(await first).toBeNull()
  expect(location.status).toBe("idle")
  await act(async () => {
    first = location.request(undefined, onError)
  })
  await render(null)
  callbacks[3].failure({ message: "Late" } as GeolocationPositionError)
  expect(await first).toBeNull()
  expect(onError).toHaveBeenCalledTimes(1)
})

test("controlled picker respects rejected selections and invalidates location on external changes", async () => {
  let succeed!: PositionCallback
  vi.stubGlobal("navigator", {
    userAgent: "Mozilla/5.0",
    platform: "Linux",
    geolocation: {
      getCurrentPosition: (callback: PositionCallback) => {
        succeed = callback
      },
    },
  })
  const map = createRef<L.Map>()
  let picker!: ReturnType<typeof useLocationPicker>
  let change!: (position: { latitude: number; longitude: number }) => void
  const onChange = vi.fn()
  function Probe() {
    picker = useLocationPicker()
    return <ReleafMap.LocationPicker.Marker />
  }
  function Controlled() {
    const [value, setValue] = useState({ latitude: 1, longitude: 2 })
    change = setValue
    return (
      <ReleafMap.Root ref={map} initialCenter={[1, 2]} initialZoom={5}>
        <ReleafMap.LocationPicker value={value} onValueChange={onChange}>
          <Probe />
        </ReleafMap.LocationPicker>
      </ReleafMap.Root>
    )
  }
  await render(<Controlled />)
  await act(async () =>
    picker.select({ latitude: 20, longitude: 30 }, "Search result", true),
  )
  expect(picker.value).toEqual({ latitude: 1, longitude: 2 })
  expect(map.current!.getCenter().equals([1, 2])).toBe(true)
  let request!: Promise<void>
  await act(async () => {
    request = picker.locate()
  })
  await act(async () => change({ latitude: 3, longitude: 4 }))
  await act(async () =>
    succeed({ coords: { latitude: 0, longitude: 0 } } as GeolocationPosition),
  )
  await request
  expect(picker.value).toEqual({ latitude: 3, longitude: 4 })
  expect(picker.source).toBe("External value")
  await act(async () => change({ latitude: 1, longitude: 2 }))
  expect(picker.source).toBe("External value")
  expect(onChange).toHaveBeenCalledTimes(1)
})

test("layer switcher changes layers without replacing the map", async () => {
  const ref = createRef<L.Map>()
  const first = createRef<L.TileLayer>()
  const second = createRef<L.TileLayer>()
  await render(
    <ReleafMap.Root ref={ref}>
      <ReleafMap.Toolbar>
        <ReleafMap.LayerSwitcher>
          <ReleafMap.LayerSwitcher.Item value="one" label="One">
            <ReleafMap.Tiles.Custom ref={first} url="one" />
          </ReleafMap.LayerSwitcher.Item>
          <ReleafMap.LayerSwitcher.Item value="two" label="Two">
            <ReleafMap.Tiles.Custom ref={second} url="two" />
          </ReleafMap.LayerSwitcher.Item>
        </ReleafMap.LayerSwitcher>
      </ReleafMap.Toolbar>
    </ReleafMap.Root>,
  )
  const original = ref.current!
  expect(original.hasLayer(first.current!)).toBe(true)
  await click(document.querySelectorAll("button")[1])
  expect(ref.current).toBe(original)
  expect(first.current).toBeNull()
  expect(original.hasLayer(second.current!)).toBe(true)
})

test("zoom controls follow limits, empty bounds disable, and child cancellation works", async () => {
  const ref = createRef<L.Map>()
  await render(
    <ReleafMap.Root
      ref={ref}
      initialZoom={3}
      options={{
        minZoom: 3,
        maxZoom: 4,
        zoomControl: false,
        zoomAnimation: false,
      }}
    >
      <ReleafMap.Actions.ZoomIn />
      <ReleafMap.Actions.ZoomOut />
      <ReleafMap.Actions.FitBounds positions={[]} />
      <ReleafMap.Actions.ZoomIn>
        <button type="button" onClick={(event) => event.preventDefault()}>
          Cancelled
        </button>
      </ReleafMap.Actions.ZoomIn>
    </ReleafMap.Root>,
  )
  const buttons = document.querySelectorAll("button")
  expect(buttons[1].disabled).toBe(true)
  expect(buttons[2].disabled).toBe(true)
  await click(buttons[3])
  expect(ref.current!.getZoom()).toBe(3)
  await click(buttons[0])
  expect(buttons[0].disabled).toBe(true)
  expect(buttons[1].disabled).toBe(false)
})

test("coordinates copy formatted output and report clipboard failures", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal("navigator", {
    userAgent: "Mozilla/5.0",
    platform: "Linux",
    clipboard: { writeText },
  })
  await render(
    <ReleafMap.Coordinates
      position={{ latitude: 1.23456, longitude: 2 }}
      precision={2}
    />,
  )
  await click(document.querySelector("button")!)
  await waitFor(() =>
    expect(document.body.textContent).toContain("Coordinates copied"),
  )
  expect(writeText).toHaveBeenCalledWith("1.23, 2.00")
  writeText.mockRejectedValue(Error("Unavailable"))
  await click(document.querySelector("button")!)
  await waitFor(() =>
    expect(document.body.textContent).toContain("Clipboard unavailable"),
  )
})

test("map search resolves generic positions, moves the camera and optionally renders a marker", async () => {
  const ref = createRef<L.Map>()
  const onSelect = vi.fn()
  await render(
    <ReleafMap.Root ref={ref}>
      <ReleafMap.Search
        search={() => [
          { name: "Destination", coords: { latitude: 20, longitude: 30 } },
        ]}
        getLabel={(result) => result.name}
        getPosition={(result) => result.coords}
        onSelect={onSelect}
        debounceMs={0}
        zoom={7}
      />
    </ReleafMap.Root>,
  )
  await type("Dest")
  await waitFor(() =>
    expect(document.querySelector('[role="option"]')).not.toBeNull(),
  )
  await click(document.querySelector('[role="option"]')!)
  expect(ref.current!.getCenter().equals([20, 30])).toBe(true)
  expect(ref.current!.getZoom()).toBe(7)
  expect(document.querySelector(".leaflet-marker-icon")).not.toBeNull()
  expect(onSelect).toHaveBeenCalledWith({
    name: "Destination",
    coords: { latitude: 20, longitude: 30 },
  })
})

test("default picker starts empty and marker dragging preserves the camera", async () => {
  const ref = createRef<L.Map>()
  await render(
    <ReleafMap.Root ref={ref}>
      <ReleafMap.LocationPicker />
    </ReleafMap.Root>,
  )
  expect(document.body.textContent).toContain("No location selected")
  expect(document.querySelector(".leaflet-marker-icon")).toBeNull()
  const camera = ref.current!.getCenter()
  await act(async () => {
    ref.current!.fire("click", { latlng: { lat: 1, lng: 2 } })
  })
  expect(document.querySelector("output")!.textContent).toBe("1.00000, 2.00000")
  let marker!: L.Marker
  ref.current!.eachLayer((layer) => {
    if ("getLatLng" in layer) marker = layer as L.Marker
  })
  await act(async () => {
    marker.setLatLng([3, 4])
    marker.fire("dragend")
  })
  expect(document.querySelector("output")!.textContent).toBe("3.00000, 4.00000")
  expect(ref.current!.getCenter().equals(camera)).toBe(true)
})

test("zoom limits update when map bounds change without a zoom change", async () => {
  const ref = createRef<L.Map>()
  await render(
    <ReleafMap.Root ref={ref} initialZoom={5} options={{ zoomControl: false }}>
      <ReleafMap.Actions.ZoomIn />
      <ReleafMap.Actions.ZoomOut />
    </ReleafMap.Root>,
  )
  const buttons = document.querySelectorAll("button")
  await act(async () => {
    ref.current!.setMaxZoom(5)
    ref.current!.setMinZoom(5)
  })
  expect(buttons[0].disabled).toBe(true)
  expect(buttons[1].disabled).toBe(true)
  await act(async () => {
    ref.current!.setMaxZoom(6)
    ref.current!.setMinZoom(4)
  })
  expect(buttons[0].disabled).toBe(false)
  expect(buttons[1].disabled).toBe(false)
})

test("camera actions honor reduced motion and fit supplied bounds", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(window, "matchMedia")
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({ matches: true }),
  })
  try {
    const ref = createRef<L.Map>()
    await render(
      <ReleafMap.Root ref={ref} options={{ zoomControl: false }}>
        <ReleafMap.Actions.FlyTo
          position={{ latitude: 1, longitude: 2 }}
          options={{ animate: true }}
        />
        <ReleafMap.Actions.FitBounds
          positions={[{ latitude: 1, longitude: 2 }, [3, 4]]}
          options={{ padding: [10, 10], animate: true }}
        />
      </ReleafMap.Root>,
    )
    const fly = vi.spyOn(ref.current!, "flyTo").mockReturnValue(ref.current!)
    const fit = vi
      .spyOn(ref.current!, "fitBounds")
      .mockReturnValue(ref.current!)
    await click(document.querySelectorAll("button")[0])
    await click(document.querySelectorAll("button")[1])
    expect(fly).toHaveBeenCalledWith([1, 2], undefined, { animate: false })
    expect(fit).toHaveBeenCalledWith(
      [
        [1, 2],
        [3, 4],
      ],
      { padding: [10, 10], animate: false },
    )
  } finally {
    if (descriptor) Object.defineProperty(window, "matchMedia", descriptor)
    else Reflect.deleteProperty(window, "matchMedia")
  }
})
