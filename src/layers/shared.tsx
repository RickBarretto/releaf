"use client"

import type * as Leaflet from "leaflet"
import type { ReactNode, Ref } from "react"
import { useContext, useEffect, useMemo, useState } from "react"
import { LayerContainerContext, useMapContext } from "../context"

export interface LayerProps<T extends Leaflet.Layer, O> {
  /** CSS classes applied to rendered layer elements, including group descendants. */
  className?: string
  /** Creation-only Leaflet options; change key to recreate. */
  options?: O
  eventHandlers?: Leaflet.LeafletEventHandlerFnMap
  ref?: Ref<T>
  children?: ReactNode
}

/** Own one instance per parent; freeze the factory so options remain creation-only. */
export function useLayer<T extends Leaflet.Layer>(
  factory: (leaflet: typeof Leaflet) => T,
): T | null {
  const { map, leaflet } = useMapContext()
  const parent = useContext(LayerContainerContext) ?? map
  const [create] = useState(() => factory)
  const [layer, setLayer] = useState<T | null>(null)

  useEffect(() => {
    const instance = create(leaflet)
    instance.addTo(parent)
    setLayer(instance)

    return () => {
      parent.removeLayer(instance)
      setLayer(null)
    }
  }, [parent, leaflet, create])

  return layer
}

/** Keep consumer classes separate from Leaflet's own classes and inline geometry. */
export function useLayerClassName(layer: Leaflet.Layer, className?: string) {
  useEffect(() => {
    const classes = className?.split(/\s+/).filter(Boolean) ?? []
    const added = new Map<Element, string[]>()
    const apply = (target: Leaflet.Layer) => {
      const rendered = target as Leaflet.Layer & {
        getElement?: () => Element | undefined
        getContainer?: () => HTMLElement | null
        eachLayer?: (callback: (child: Leaflet.Layer) => void) => void
      }
      const element = rendered.getElement?.() ?? rendered.getContainer?.()
      if (element && !added.has(element)) {
        const tokens = classes.filter(
          (token) => !element.classList.contains(token),
        )
        element.classList.add(...tokens)
        added.set(element, tokens)
      }
      rendered.eachLayer?.(apply)
    }
    const update = () => apply(layer)
    layer.on("add layeradd", update)
    update()
    return () => {
      layer.off("add layeradd", update)
      for (const [element, tokens] of added) element.classList.remove(...tokens)
    }
  }, [layer, className])
}

export interface PathProps<
  T extends Leaflet.Path,
  O extends Leaflet.PathOptions = Leaflet.PathOptions,
> extends LayerProps<T, O> {
  /** Mutable path style. Omitted style keys return to their creation values. */
  pathOptions?: Leaflet.PathOptions
}

/** Restore removed style overrides from the complete initial Leaflet options. */
export function usePathStyle(
  layer: Leaflet.Path | null,
  style?: Leaflet.PathOptions,
) {
  const initial = useMemo(() => {
    if (!layer) return null

    // Leaflet stores defaults on the options prototype; include inherited keys.
    const options: Record<string, unknown> = {}
    for (const key in layer.options)
      options[key] = layer.options[key as keyof Leaflet.PathOptions]
    // CircleMarker.setStyle also accepts radius internally; the radius prop owns it.
    delete options.radius

    return options as Leaflet.PathOptions
  }, [layer])

  useEffect(() => {
    if (layer && initial) layer.setStyle({ ...initial, ...style })
  }, [layer, initial, style])
}
