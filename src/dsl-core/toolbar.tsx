"use client"

import type * as Leaflet from "leaflet"
import type { ComponentPropsWithoutRef } from "react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useMapContext } from "../context"

export interface ToolbarProps
  extends Omit<ComponentPropsWithoutRef<"div">, "style"> {
  /** Overrides corner flags; otherwise defaults to top right. */
  position?: Leaflet.ControlPosition
  top?: boolean
  bottom?: boolean
  left?: boolean
  right?: boolean
}

export function Toolbar({
  position,
  top,
  bottom,
  left,
  right,
  children,
  ...props
}: ToolbarProps) {
  const { map, leaflet } = useMapContext()
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const corner =
    position ??
    (`${bottom ? "bottom" : "top"}${left ? "left" : "right"}` as Leaflet.ControlPosition)

  useEffect(() => {
    const container = document.createElement("div")
    const control = new leaflet.Control({ position: corner })
    control.onAdd = () => container
    leaflet.DomEvent.disableClickPropagation(container)
    leaflet.DomEvent.disableScrollPropagation(container)
    control.addTo(map)
    setElement(container)

    return () => {
      control.remove()
      setElement(null)
    }
  }, [map, leaflet, corner])

  return element
    ? createPortal(
        // biome-ignore lint/a11y/noStaticElementInteractions: This container isolates clicks; child controls provide interactions.
        // biome-ignore lint/a11y/useKeyWithClickEvents: Keyboard-generated clicks are isolated by the same handler.
        <div
          {...props}
          onClick={(event) => {
            props.onClick?.(event)
            // A selection can remove its target before Leaflet checks the DOM ancestry.
            event.stopPropagation()
          }}
        >
          {children}
        </div>,
        element,
      )
    : null
}
