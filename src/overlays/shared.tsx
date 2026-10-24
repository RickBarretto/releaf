"use client"

import type * as Leaflet from "leaflet"
import { useContext, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { LayerContext, useMapContext } from "../context"
import type { PopupProps } from "./popup"
import type { TooltipProps } from "./tooltip"

/** Bind to the nearest layer, or open directly on the map when standalone. */
export function useOverlay(
  kind: "popup" | "tooltip",
  { children, position, options, open, className }: PopupProps | TooltipProps,
) {
  const { map, leaflet } = useMapContext()
  const parent = useContext(LayerContext)
  const [initialOptions] = useState(() => options)
  const [state, setState] = useState<{
    overlay: Leaflet.Popup | Leaflet.Tooltip
    element: HTMLDivElement
  } | null>(null)

  useEffect(() => {
    const element = document.createElement("div")
    const overlay =
      kind === "popup"
        ? leaflet.popup(
            initialOptions as Leaflet.PopupOptions,
            parent ?? undefined,
          )
        : leaflet.tooltip(
            initialOptions as Leaflet.TooltipOptions,
            parent ?? undefined,
          )
    overlay.setContent(element)
    if (parent) {
      if (kind === "popup") parent.bindPopup(overlay as Leaflet.Popup)
      else parent.bindTooltip(overlay as Leaflet.Tooltip)
    }
    setState({ overlay, element })

    return () => {
      if (parent) {
        if (kind === "popup") parent.unbindPopup()
        else parent.unbindTooltip()
      }
      overlay.remove()
      setState(null)
    }
  }, [kind, leaflet, parent, initialOptions])

  useEffect(() => {
    if (position) state?.overlay.setLatLng(position)
  }, [state, position])

  useEffect(() => {
    if (!state) return

    if (!parent && !position)
      throw new Error("Standalone Popup and Tooltip require a position.")
    if (open === false) state.overlay.close()
    else if (open === true || !parent) {
      if (parent) {
        if (kind === "popup") parent.openPopup()
        else parent.openTooltip()
      } else state.overlay.openOn(map)
    }
  }, [state, parent, position, open, kind, map])

  useEffect(() => {
    if (state) {
      state.element.className = className ?? ""
      state.overlay.update()
    }
  }, [state, className])

  // Portal content commits before passive effects; update Leaflet's layout afterward.
  // biome-ignore lint/correctness/useExhaustiveDependencies: New portal content requires Leaflet to recalculate the overlay layout.
  useEffect(() => {
    state?.overlay.update()
  }, [state, children])

  return state ? createPortal(children, state.element) : null
}
