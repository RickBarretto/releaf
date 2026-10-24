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

/** User-triggered geolocation with logical cancellation of obsolete requests. */
export function useLocationRequest() {
  const generation = useRef(0)
  const [state, setState] = useState<{
    position: Position | null
    status: LocationRequestStatus
    error: Error | null
  }>({ position: null, status: "idle", error: null })
  useEffect(
    () => () => {
      generation.current += 1
    },
    [],
  )
  const reset = useCallback(() => {
    generation.current += 1
    setState({ position: null, status: "idle", error: null })
  }, [])
  const request = useCallback(
    async (
      options?: PositionOptions,
      onError?: (error: Error) => void,
    ): Promise<Position | null> => {
      const id = ++generation.current
      setState({ position: null, status: "pending", error: null })
      try {
        const position = await requestCurrentLocation(options)
        if (id !== generation.current) return null
        setState({ position, status: "success", error: null })
        return position
      } catch (cause) {
        if (id !== generation.current) return null
        const error = cause instanceof Error ? cause : new Error(String(cause))
        setState({ position: null, status: "error", error })
        onError?.(error)
        return null
      }
    },
    [],
  )
  return { ...state, request, reset }
}
