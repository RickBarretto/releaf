import { Suspense } from "react"
import { afterEach, expect, test, vi } from "vitest"
import { requestCurrentLocation, useCurrentLocation } from "../../src/location"
import { cleanup, render, waitFor } from "./helpers"

afterEach(async () => {
  await cleanup()
  vi.unstubAllGlobals()
})

test("suspends until the requested browser location resolves", async () => {
  let succeed!: PositionCallback
  const getCurrentPosition = vi.fn((callback: PositionCallback) => {
    succeed = callback
  })
  vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } })
  const request = requestCurrentLocation()
  function Result() {
    const position = useCurrentLocation(request)
    return (
      <p>
        {position.latitude}, {position.longitude}
      </p>
    )
  }
  await render(
    <Suspense fallback={<p>Locating…</p>}>
      <Result />
    </Suspense>,
  )
  expect(document.body.textContent).toContain("Locating…")
  succeed({ coords: { latitude: 12, longitude: 34 } } as GeolocationPosition)
  await waitFor(() => expect(document.body.textContent).toContain("12, 34"))
  expect(getCurrentPosition).toHaveBeenCalledTimes(1)
})

test("rejects when geolocation is unavailable", async () => {
  vi.stubGlobal("navigator", {})
  await expect(requestCurrentLocation()).rejects.toThrow("unavailable")
})
