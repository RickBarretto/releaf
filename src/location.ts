"use client"

import { use } from "react"
import type { Position } from "./dsl"

/** Request permission on user interaction; keep the promise in state for Suspense. */
export function requestCurrentLocation(
  options: PositionOptions = { timeout: 10000 },
): Promise<Position> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is unavailable in this browser."))
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      (error) => reject(new Error(error.message)),
      options,
    )
  })
}

/** Suspends while a stable request is pending; failures reach the nearest error boundary. */
export function useCurrentLocation(request: Promise<Position>): Position {
  return use(request)
}
