"use client"

import type * as Leaflet from "leaflet"
import { useEffect } from "react"
import { useMapContext } from "./context"

interface RotationState {
  bearing: number
  enabled: boolean
  turn: (degrees: number | null) => void
  apply: () => void
}

// Weak keys let removed maps and their rotation state be garbage collected.
const rotations = new WeakMap<Leaflet.Map, RotationState>()

export function getRotationState(map: Leaflet.Map): RotationState {
  let state = rotations.get(map)
  if (!state) {
    state = { bearing: 0, enabled: false, turn() {}, apply() {} }
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
  /** Animate bearing changes. Respects prefers-reduced-motion. */
  animate?: boolean
  /** Rotation animation duration in milliseconds. */
  duration?: number
}

/** Rotate the map pane and restore native coordinate conversions on cleanup. */
export function Rotation({
  enabled = true,
  animate = true,
  duration = 300,
}: RotationProps) {
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
    const overlayObserverOptions = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    }
    const updateOverlays = () => {
      // Observe Leaflet's changes, but never feed our own style writes back
      // into the observer (CSS serialization can round animated angles).
      overlayObserver.disconnect()
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
        // Browsers round fractional angles when serializing CSS. Remember the
        // serialized suffix so the next update replaces it instead of appending
        // another rotation and triggering an endless MutationObserver loop.
        if (saved.suffix) {
          saved.suffix = element.style.transform.slice(
            element.style.transform.lastIndexOf("rotate("),
          )
        }
        const origin = !enabled
          ? saved.origin
          : (popupOrigins.get(element) ??
            `${-(Number.parseFloat(element.style.marginLeft) || 0)}px ${-(Number.parseFloat(element.style.marginTop) || 0)}px`)
        if (element.style.transformOrigin !== origin)
          element.style.transformOrigin = origin
      }
      overlayObserver.observe(map.getContainer(), overlayObserverOptions)
    }
    // Leaflet replaces transforms during pan, zoom, drag and icon changes.
    const overlayObserver = new window.MutationObserver(updateOverlays)
    overlayObserver.observe(map.getContainer(), overlayObserverOptions)
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
    let frame: number | undefined
    let target = state.bearing
    const normalize = (angle: number) => ((angle % 360) + 360) % 360
    state.turn = (degrees) => {
      if (degrees !== null && (!enabled || !Number.isFinite(degrees))) return
      if (frame !== undefined) window.cancelAnimationFrame(frame)
      frame = undefined
      target = degrees === null ? 0 : target + degrees
      const start = state.bearing
      // Reset north takes the shortest route; rotateBy preserves direction.
      const end =
        degrees === null
          ? start + ((540 - normalize(start)) % 360) - 180
          : target
      const finish = () => {
        state.bearing = normalize(end)
        target = state.bearing
        state.apply()
      }
      if (
        !enabled ||
        !animate ||
        !Number.isFinite(duration) ||
        duration <= 0 ||
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
      ) {
        finish()
        return
      }
      target = end
      const started = window.performance.now()
      const tick = (now: number) => {
        const progress = Math.min(1, Math.max(0, (now - started) / duration))
        if (progress === 1) {
          frame = undefined
          finish()
          return
        }
        const eased = 1 - (1 - progress) ** 3
        state.bearing = start + (end - start) * eased
        state.apply()
        frame = window.requestAnimationFrame(tick)
      }
      frame = window.requestAnimationFrame(tick)
    }
    map.on("move resize zoom", state.apply)
    state.apply()

    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame)
      state.bearing = normalize(target)
      state.turn = () => {}
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
  }, [map, leaflet, enabled, animate, duration])

  return null
}
