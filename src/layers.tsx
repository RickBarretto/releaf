"use client"

import type * as Leaflet from "leaflet"
import type { ReactNode, Ref } from "react"
import {
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react"
import {
  LayerContainerContext,
  LayerContext,
  useEventHandlers,
  useMapContext,
} from "./context"

interface LayerProps<T extends Leaflet.Layer, O> {
  /** CSS classes applied to rendered layer elements, including group descendants. */
  className?: string
  /** Creation-only Leaflet options; change key to recreate. */
  options?: O
  eventHandlers?: Leaflet.LeafletEventHandlerFnMap
  ref?: Ref<T>
  children?: ReactNode
}

/** Own one instance per parent; freeze the factory so options remain creation-only. */
function useLayer<T extends Leaflet.Layer>(
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
function useLayerClassName(layer: Leaflet.Layer, className?: string) {
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

/** Mount descendants only after their Leaflet parent exists. */
function LayerReady<T extends Leaflet.Layer>({
  layer,
  layerRef,
  eventHandlers,
  className,
  children,
}: {
  layer: T
  className?: string
  layerRef?: Ref<T>
  eventHandlers?: Leaflet.LeafletEventHandlerFnMap
  children?: ReactNode
}) {
  useImperativeHandle(layerRef, () => layer, [layer])

  useEventHandlers(layer, eventHandlers)
  useLayerClassName(layer, className)

  return <LayerContext value={layer}>{children}</LayerContext>
}

function renderLayer<T extends Leaflet.Layer>(
  layer: T | null,
  props: LayerProps<T, unknown>,
) {
  return layer ? (
    <LayerReady
      layer={layer}
      className={props.className}
      layerRef={props.ref}
      eventHandlers={props.eventHandlers}
    >
      {props.children}
    </LayerReady>
  ) : null
}

export interface TileLayerProps
  extends LayerProps<Leaflet.TileLayer, Leaflet.TileLayerOptions> {
  url: string
  opacity?: number
  zIndex?: number
}

/** A tile source with mutable URL, opacity, and stacking order. */
export function TileLayer(props: TileLayerProps) {
  const { url, options, opacity, zIndex } = props
  const [defaults] = useState(() => ({
    opacity: options?.opacity ?? 1,
    zIndex: options?.zIndex ?? 1,
  }))
  const layer = useLayer((L) => L.tileLayer(url, options))

  useEffect(() => {
    layer?.setUrl(url)
  }, [layer, url])

  useEffect(() => {
    layer?.setOpacity(opacity ?? defaults.opacity)
  }, [layer, opacity, defaults])

  useEffect(() => {
    layer?.setZIndex(zIndex ?? defaults.zIndex)
  }, [layer, zIndex, defaults])

  return renderLayer(layer, props)
}

export interface MarkerProps
  extends LayerProps<Leaflet.Marker, Leaflet.MarkerOptions> {
  position: Leaflet.LatLngExpression
  opacity?: number
  draggable?: boolean
  zIndexOffset?: number
}

/** A marker with mutable position and interaction props. */
export function Marker(props: MarkerProps) {
  const { position, options, opacity, draggable, zIndexOffset } = props
  const [defaults] = useState(() => ({
    opacity: options?.opacity ?? 1,
    draggable: options?.draggable ?? false,
    zIndexOffset: options?.zIndexOffset ?? 0,
  }))
  const layer = useLayer((L) => L.marker(position, options))

  useEffect(() => {
    layer?.setLatLng(position)
  }, [layer, position])

  useEffect(() => {
    layer?.setOpacity(opacity ?? defaults.opacity)
  }, [layer, opacity, defaults])

  useEffect(() => {
    layer?.setZIndexOffset(zIndexOffset ?? defaults.zIndexOffset)
  }, [layer, zIndexOffset, defaults])

  useEffect(() => {
    if (draggable ?? defaults.draggable) layer?.dragging?.enable()
    else layer?.dragging?.disable()
  }, [layer, draggable, defaults])

  return renderLayer(layer, props)
}

interface PathProps<
  T extends Leaflet.Path,
  O extends Leaflet.PathOptions = Leaflet.PathOptions,
> extends LayerProps<T, O> {
  /** Mutable path style. Omitted style keys return to their creation values. */
  pathOptions?: Leaflet.PathOptions
}

/** Restore removed style overrides from the complete initial Leaflet options. */
function usePathStyle(layer: Leaflet.Path | null, style?: Leaflet.PathOptions) {
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

export interface PolylineProps
  extends PathProps<Leaflet.Polyline, Leaflet.PolylineOptions> {
  positions: Leaflet.LatLngExpression[] | Leaflet.LatLngExpression[][]
}

/** A line or multi-line geometry with mutable positions and style. */
export function Polyline(props: PolylineProps) {
  const layer = useLayer((L) => L.polyline(props.positions, props.options))

  useEffect(() => {
    layer?.setLatLngs(props.positions)
  }, [layer, props.positions])

  usePathStyle(layer, props.pathOptions)

  return renderLayer(layer, props)
}

export interface PolygonProps
  extends PathProps<Leaflet.Polygon, Leaflet.PolylineOptions> {
  positions:
    | Leaflet.LatLngExpression[]
    | Leaflet.LatLngExpression[][]
    | Leaflet.LatLngExpression[][][]
}

/** A polygon, polygon with holes, or multi-polygon geometry. */
export function Polygon(props: PolygonProps) {
  const layer = useLayer((L) => L.polygon(props.positions, props.options))

  useEffect(() => {
    layer?.setLatLngs(props.positions)
  }, [layer, props.positions])

  usePathStyle(layer, props.pathOptions)

  return renderLayer(layer, props)
}

export interface CircleProps
  extends PathProps<Leaflet.Circle, Leaflet.CircleMarkerOptions> {
  center: Leaflet.LatLngExpression
  radius: number
}

/** A geographic circle whose radius is measured in meters. */
export function Circle(props: CircleProps) {
  const layer = useLayer((L) =>
    L.circle(props.center, { ...props.options, radius: props.radius }),
  )

  useEffect(() => {
    layer?.setLatLng(props.center)
  }, [layer, props.center])

  useEffect(() => {
    layer?.setRadius(props.radius)
  }, [layer, props.radius])

  usePathStyle(layer, props.pathOptions)

  return renderLayer(layer, props)
}

export interface CircleMarkerProps
  extends PathProps<Leaflet.CircleMarker, Leaflet.CircleMarkerOptions> {
  center: Leaflet.LatLngExpression
  radius?: number
}

/** A screen-sized circle whose radius is measured in pixels. */
export function CircleMarker(props: CircleMarkerProps) {
  const [initialRadius] = useState(() => props.options?.radius ?? 10)
  const layer = useLayer((L) => L.circleMarker(props.center, props.options))

  useEffect(() => {
    layer?.setLatLng(props.center)
  }, [layer, props.center])

  useEffect(() => {
    layer?.setRadius(props.radius ?? initialRadius)
  }, [layer, props.radius, initialRadius])

  usePathStyle(layer, props.pathOptions)

  return renderLayer(layer, props)
}

export interface RectangleProps extends PathProps<Leaflet.Rectangle> {
  bounds: Leaflet.LatLngBoundsExpression
}

/** A rectangular path with mutable geographic bounds. */
export function Rectangle(props: RectangleProps) {
  const layer = useLayer((L) => L.rectangle(props.bounds, props.options))

  useEffect(() => {
    layer?.setBounds(props.bounds)
  }, [layer, props.bounds])

  usePathStyle(layer, props.pathOptions)

  return renderLayer(layer, props)
}

export type LayerGroupProps = LayerProps<
  Leaflet.LayerGroup,
  Leaflet.LayerOptions
>

/** Group children for shared membership without propagating their events. */
export function LayerGroup(props: LayerGroupProps) {
  const layer = useLayer((L) => L.layerGroup([], props.options))

  return layer ? (
    <LayerContainerContext value={layer}>
      {renderLayer(layer, props)}
    </LayerContainerContext>
  ) : null
}

export type FeatureGroupProps = LayerProps<
  Leaflet.FeatureGroup,
  Leaflet.LayerOptions
>

/** Group children and propagate their events to the group. */
export function FeatureGroup(props: FeatureGroupProps) {
  const layer = useLayer((L) => L.featureGroup([], props.options))

  return layer ? (
    <LayerContainerContext value={layer}>
      {renderLayer(layer, props)}
    </LayerContainerContext>
  ) : null
}

export interface GeoJSONProps
  extends LayerProps<Leaflet.GeoJSON, Leaflet.GeoJSONOptions> {
  data: Parameters<typeof Leaflet.geoJSON>[0]
  pathOptions?: Leaflet.PathOptions
}

/** Replaces features when data identity changes; memoize large datasets. */
export function GeoJSON(props: GeoJSONProps) {
  const layer = useLayer((L) => L.geoJSON(undefined, props.options))

  useEffect(() => {
    if (!layer) return

    layer.clearLayers()
    if (Array.isArray(props.data)) {
      for (const feature of props.data) layer.addData(feature)
    } else if (props.data) layer.addData(props.data)
  }, [layer, props.data])

  // biome-ignore lint/correctness/useExhaustiveDependencies: Reapply styles after the preceding effect replaces GeoJSON features.
  useEffect(() => {
    layer?.resetStyle()
    if (props.pathOptions) layer?.setStyle(props.pathOptions)
  }, [layer, props.data, props.pathOptions])

  return renderLayer(layer, props)
}

export interface ImageOverlayProps
  extends LayerProps<Leaflet.ImageOverlay, Leaflet.ImageOverlayOptions> {
  url: string
  bounds: Leaflet.LatLngBoundsExpression
  opacity?: number
  zIndex?: number
}

/** An image stretched across mutable geographic bounds. */
export function ImageOverlay(props: ImageOverlayProps) {
  const { leaflet } = useMapContext()
  const [defaults] = useState(() => ({
    opacity: props.options?.opacity ?? 1,
    zIndex: props.options?.zIndex ?? 1,
  }))
  const layer = useLayer((L) =>
    L.imageOverlay(props.url, props.bounds, props.options),
  )

  useEffect(() => {
    layer?.setUrl(props.url)
  }, [layer, props.url])

  useEffect(() => {
    const bounds =
      props.bounds instanceof leaflet.LatLngBounds
        ? props.bounds
        : leaflet.latLngBounds(props.bounds)
    layer?.setBounds(bounds)
  }, [layer, leaflet, props.bounds])

  useEffect(() => {
    layer?.setOpacity(props.opacity ?? defaults.opacity)
  }, [layer, props.opacity, defaults])

  useEffect(() => {
    layer?.setZIndex(props.zIndex ?? defaults.zIndex)
  }, [layer, props.zIndex, defaults])

  return renderLayer(layer, props)
}
