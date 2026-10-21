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

    // Leaflet 1.9 exposes no public hook for adjusting navigation vectors.
    const dragging = map.dragging as Leaflet.Handler & {
      _onPreDragLimit: () => void
      _onPreDragWrap: () => void
      _draggable?: { _newPos: Leaflet.Point; _startPos: Leaflet.Point }
    }
    const keyboard = map.keyboard as Leaflet.Handler & {
      _panKeys: Record<string, [number, number]>
    }
    const original = {
      to: map.layerPointToContainerPoint,
      from: map.containerPointToLayerPoint,
      rotate: pane.style.rotate,
      origin: pane.style.transformOrigin,
      preDragLimit: dragging._onPreDragLimit,
      panKeys: keyboard._panKeys,
    }
    const overlayStyles = new Map<
      HTMLElement,
      { origin: string; suffix: string }
    >()
    const updateOverlays = () => {
      const popupOrigins = new Map<HTMLElement, string>()
      map.eachLayer((layer) => {
        if (!(layer instanceof leaflet.Popup)) return
        const element = layer.getElement()
        const position = layer.getLatLng()
        if (!element || !position) return
        const anchor = map.latLngToLayerPoint(position)
        const translation = leaflet.DomUtil.getPosition(element)
        const marginBottom =
          Number.parseFloat(window.getComputedStyle(element).marginBottom) || 0
        // Pivot at the geographic anchor, including the popup's layout offsets.
        // This keeps popupAnchor and offset in screen axes above the upright icon.
        popupOrigins.set(
          element,
          `${anchor.x - translation.x - (Number.parseFloat(element.style.left) || 0)}px ${anchor.y - translation.y + element.offsetHeight + marginBottom + (Number.parseFloat(element.style.bottom) || 0)}px`,
        )
      })
      for (const element of map
        .getContainer()
        .querySelectorAll<HTMLElement>(
          ".leaflet-marker-icon, .leaflet-marker-shadow, .leaflet-popup",
        )) {
        let saved = overlayStyles.get(element)
        if (!saved) {
          saved = { origin: element.style.transformOrigin, suffix: "" }
          overlayStyles.set(element, saved)
        }
        let transform = element.style.transform
        if (saved.suffix && transform.endsWith(saved.suffix)) {
          transform = transform.slice(0, -saved.suffix.length).trimEnd()
        }
        // Append rotation after Leaflet's translation so the geographic anchor
        // stays in place. Icon margins encode the marker anchor coordinates.
        saved.suffix = enabled ? `rotate(${-state.bearing}deg)` : ""
        const next = [transform, saved.suffix].filter(Boolean).join(" ")
        if (element.style.transform !== next) element.style.transform = next
        const origin = !enabled
          ? saved.origin
          : (popupOrigins.get(element) ??
            `${-(Number.parseFloat(element.style.marginLeft) || 0)}px ${-(Number.parseFloat(element.style.marginTop) || 0)}px`)
        if (element.style.transformOrigin !== origin)
          element.style.transformOrigin = origin
      }
    }
    // Leaflet replaces transforms during pan, zoom, drag and icon changes.
    const overlayObserver = new window.MutationObserver(updateOverlays)
    overlayObserver.observe(map.getContainer(), {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    })
    // Leaflet coordinates are unrotated; both conversions must match the CSS rotation.
    const rotate = (point: Leaflet.Point, angle: number) =>
      rotateAroundCenter(leaflet, point, map.getSize().divideBy(2), angle)
    const movement = (point: Leaflet.Point) =>
      rotateAroundCenter(
        leaflet,
        point,
        leaflet.point(0, 0),
        enabled ? -state.bearing : 0,
      )
    const preDragLimit = () => {
      const draggable = dragging._draggable
      if (draggable) {
        draggable._newPos = draggable._startPos.add(
          movement(draggable._newPos.subtract(draggable._startPos)),
        )
      }
      original.preDragLimit.call(dragging)
    }
    // Replace the existing listener in place, before Leaflet's world wrapping.
    const draggable = dragging._draggable as
      | (Leaflet.Evented & NonNullable<typeof dragging._draggable>)
      | undefined
    draggable?.off("predrag", original.preDragLimit, dragging)
    draggable?.on("predrag", preDragLimit, dragging)
    if (map.options.worldCopyJump) {
      draggable?.off("predrag", dragging._onPreDragWrap, dragging)
      draggable?.on("predrag", dragging._onPreDragWrap, dragging)
    }
    dragging._onPreDragLimit = preDragLimit
    state.enabled = enabled
    state.apply = () => {
      // CSS rotate also rotates Leaflet's translate transform. Keep this pivot
      // fixed in container coordinates so panning is transformed exactly once.
      const center = map.getSize().divideBy(2)
      pane.style.transformOrigin = `${center.x}px ${center.y}px`
      pane.style.rotate = `${enabled ? state.bearing : 0}deg`
      updateOverlays()
      keyboard._panKeys = Object.fromEntries(
        Object.entries(original.panKeys).map(([key, offset]) => {
          const point = movement(leaflet.point(offset))
          return [key, [point.x, point.y]]
        }),
      )
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
      overlayObserver.disconnect()
      for (const [element, saved] of overlayStyles) {
        if (saved.suffix && element.style.transform.endsWith(saved.suffix)) {
          element.style.transform = element.style.transform
            .slice(0, -saved.suffix.length)
            .trimEnd()
        }
        element.style.transformOrigin = saved.origin
      }
      map.off("move resize zoom", state.apply)
      map.layerPointToContainerPoint = original.to
      map.containerPointToLayerPoint = original.from
      const activeDraggable = dragging._draggable as typeof draggable
      activeDraggable?.off("predrag", preDragLimit, dragging)
      activeDraggable?.on("predrag", original.preDragLimit, dragging)
      if (map.options.worldCopyJump) {
        activeDraggable?.off("predrag", dragging._onPreDragWrap, dragging)
        activeDraggable?.on("predrag", dragging._onPreDragWrap, dragging)
      }
      dragging._onPreDragLimit = original.preDragLimit
      keyboard._panKeys = original.panKeys
      pane.style.rotate = original.rotate
      pane.style.transformOrigin = original.origin
      state.enabled = false
      state.apply = () => {}
    }
  }, [map, leaflet, enabled])

  return null
}
