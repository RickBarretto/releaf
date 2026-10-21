"use client"

import type * as Leaflet from "leaflet"
import { useEffect } from "react"
import { useMapContext } from "./context"

interface RotationState {
  bearing: number
  enabled: boolean
  apply: () => void
}

// Weak keys let removed maps and their rotation state be garbage collected.
const rotations = new WeakMap<Leaflet.Map, RotationState>()

export function getRotationState(map: Leaflet.Map): RotationState {
  let state = rotations.get(map)
  if (!state) {
    state = { bearing: 0, enabled: false, apply() {} }
    rotations.set(map, state)
  }

  return state
}

/** Rotate a container point around the visible map center, in CSS degrees. */
function rotateAroundCenter(
  leaflet: typeof Leaflet,
  point: Leaflet.Point,
  center: Leaflet.Point,
  degrees: number,
): Leaflet.Point {
  const offset = point.subtract(center)
  const radians = (degrees * Math.PI) / 180
  const cosine = Math.cos(radians)
  const sine = Math.sin(radians)

  return leaflet
    .point(
      offset.x * cosine - offset.y * sine,
      offset.x * sine + offset.y * cosine,
    )
    .add(center)
}

export interface RotationProps {
  /** Disable rotation temporarily while preserving the current bearing. */
  enabled?: boolean
}

/** Rotate the map pane and restore native coordinate conversions on cleanup. */
export function Rotation({ enabled = true }: RotationProps) {
  const { map, leaflet } = useMapContext()

  useEffect(() => {
    const state = getRotationState(map)
    const pane = map.getPane("mapPane")
    if (!pane) return

    const original = {
      to: map.layerPointToContainerPoint,
      from: map.containerPointToLayerPoint,
      rotate: pane.style.rotate,
      origin: pane.style.transformOrigin,
    }
    // Leaflet coordinates are unrotated; both conversions must match the CSS rotation.
    const rotate = (point: Leaflet.Point, angle: number) =>
      rotateAroundCenter(leaflet, point, map.getSize().divideBy(2), angle)
    state.enabled = enabled
    state.apply = () => {
      const offset = original.to.call(map, leaflet.point(0, 0))
      const center = map.getSize().divideBy(2).subtract(offset)
      pane.style.transformOrigin = `${center.x}px ${center.y}px`
      pane.style.rotate = `${enabled ? state.bearing : 0}deg`
    }
    map.layerPointToContainerPoint = (point) =>
      rotate(original.to.call(map, point), enabled ? state.bearing : 0)
    map.containerPointToLayerPoint = (point) =>
      original.from.call(
        map,
        rotate(leaflet.point(point), enabled ? -state.bearing : 0),
      )
    map.on("move resize zoom", state.apply)
    state.apply()

    return () => {
      map.off("move resize zoom", state.apply)
      map.layerPointToContainerPoint = original.to
      map.containerPointToLayerPoint = original.from
      pane.style.rotate = original.rotate
      pane.style.transformOrigin = original.origin
      state.enabled = false
      state.apply = () => {}
    }
  }, [map, leaflet, enabled])

  return null
}
