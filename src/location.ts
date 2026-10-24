"use client"

import { use, useCallback, useEffect, useRef, useState } from "react"
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

export type LocationRequestStatus = "idle" | "pending" | "success" | "error"

export type LocationRequestState =
  | { status: "idle" | "pending" }
  | { status: "success"; position: Position }
  | { status: "error"; error: Error }

/** User-triggered geolocation with logical cancellation of obsolete requests. */
export function useLocationRequest() {
  const generation = useRef(0)
  const [state, setState] = useState<LocationRequestState>({ status: "idle" })
  useEffect(
    () => () => {
      generation.current += 1
    },
    [],
  )
  const reset = useCallback(() => {
    generation.current += 1
    setState({ status: "idle" })
  }, [])
  const request = useCallback(
    async (
      options?: PositionOptions,
      onError?: (error: Error) => void,
    ): Promise<Position | null> => {
      const id = ++generation.current
      setState({ status: "pending" })
      try {
        const position = await requestCurrentLocation(options)
        if (id !== generation.current) return null
        setState({ position, status: "success" })
        return position
      } catch (cause) {
        if (id !== generation.current) return null
        const error = cause instanceof Error ? cause : new Error(String(cause))
        setState({ status: "error", error })
        onError?.(error)
        return null
      }
    },
    [],
  )
  return { ...state, request, reset }
}
