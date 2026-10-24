"use client"

import type * as Leaflet from "leaflet"
import { useEffect } from "react"
import { useMapContext } from "../context"
import { cn } from "../lib/utils"
import type { MapAttributionProps } from "./map-attribution"

/**
 * Applies branding, positioning, and classes to Leaflet’s live attribution control.
 *
 * Internal to the map provider. Observes provider-credit changes to style new links
 * and restores the previous prefix and position when its effect is cleaned up.
 */
export function AttributionFooter({
  top,
  bottom,
  left,
  prefix,
  className,
}: MapAttributionProps) {
  const { map } = useMapContext()
  const position =
    `${top && !bottom ? "top" : "bottom"}${left ? "left" : "right"}` as Leaflet.ControlPosition

  useEffect(() => {
    const control = map.attributionControl
    if (!control) return

    const previousPrefix = control.options.prefix
    const previousPosition = control.getPosition()
    control.setPosition(position)
    const element = control.getContainer()
    if (!element) return
    const branding =
      '<a href="https://github.com/RickBarretto/releaf">{Re}leaf</a> · Powered by <a href="https://leafletjs.com">Leaflet</a>'
    control.setPrefix(prefix ?? branding)
    element.dataset.slot = "map-footer"
    element.setAttribute("aria-label", "Map copyright and contributors")
    // Leaflet styles are unlayered; important utilities keep its defaults from winning.
    const footerClasses =
      "box-border! max-w-[calc(100vw-2rem)]! m-2! px-2! py-1! border! border-solid! border-border! rounded-lg! bg-background! text-muted-foreground! shadow-[0_1px_3px_#0000001a]! font-[inherit]! text-[0.6875rem]! leading-normal!".split(
        " ",
      )
    const customClasses = className?.split(/\s+/).filter(Boolean) ?? []
    element.classList.add(...footerClasses, ...customClasses)
    const styleLinks = () => {
      for (const link of element.querySelectorAll("a")) {
        link.className = cn(
          link.className,
          "inline! h-auto! p-0! rounded-xs! text-foreground! text-[length:inherit]! whitespace-normal! no-underline! hover:underline! outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )
      }
    }
    styleLinks()
    const observer = new window.MutationObserver(styleLinks)
    observer.observe(element, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      control.setPrefix(
        typeof previousPrefix === "string" ? previousPrefix : false,
      )
      control.setPosition(previousPosition)
      element.classList.remove(...footerClasses, ...customClasses)
      delete element.dataset.slot
      element.removeAttribute("aria-label")
    }
  }, [map, position, prefix, className])

  return null
}
