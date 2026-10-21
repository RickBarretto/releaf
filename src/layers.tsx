"use client";

import type * as L from "leaflet";
import type { ReactNode, Ref } from "react";
import {
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import {
  LayerContainerContext,
  LayerContext,
  useEventHandlers,
  useMapContext,
} from "./context";

interface LayerProps<T extends L.Layer, O> {
  /** Creation-only Leaflet options; change key to recreate. */
  options?: O;
  eventHandlers?: L.LeafletEventHandlerFnMap;
  ref?: Ref<T>;
  children?: ReactNode;
}

function useLayer<T extends L.Layer>(
  factory: (leaflet: typeof L) => T,
): T | null {
  const { map, leaflet } = useMapContext();
  const parent = useContext(LayerContainerContext) ?? map;
  const [create] = useState(() => factory);
  const [layer, setLayer] = useState<T | null>(null);
  useEffect(() => {
    const instance = create(leaflet);
    instance.addTo(parent);
    setLayer(instance);
    return () => {
      parent.removeLayer(instance);
      setLayer(null);
    };
  }, [parent, leaflet, create]);
  return layer;
}

function LayerReady<T extends L.Layer>({
  layer,
  layerRef,
  eventHandlers,
  children,
}: {
  layer: T;
  layerRef?: Ref<T>;
  eventHandlers?: L.LeafletEventHandlerFnMap;
  children?: ReactNode;
}) {
  useImperativeHandle(layerRef, () => layer, [layer]);
  useEventHandlers(layer, eventHandlers);
  return <LayerContext value={layer}>{children}</LayerContext>;
}

function renderLayer<T extends L.Layer>(
  layer: T | null,
  props: LayerProps<T, unknown>,
) {
  return layer ? (
    <LayerReady
      layer={layer}
      layerRef={props.ref}
      eventHandlers={props.eventHandlers}
    >
      {props.children}
    </LayerReady>
  ) : null;
}

export interface TileLayerProps
  extends LayerProps<L.TileLayer, L.TileLayerOptions> {
  url: string;
  opacity?: number;
  zIndex?: number;
}

export function TileLayer(props: TileLayerProps) {
  const { url, options, opacity, zIndex } = props;
  const [defaults] = useState(() => ({
    opacity: options?.opacity ?? 1,
    zIndex: options?.zIndex ?? 1,
  }));
  const layer = useLayer((L) => L.tileLayer(url, options));
  useEffect(() => {
    layer?.setUrl(url);
  }, [layer, url]);
  useEffect(() => {
    layer?.setOpacity(opacity ?? defaults.opacity);
  }, [layer, opacity, defaults]);
  useEffect(() => {
    layer?.setZIndex(zIndex ?? defaults.zIndex);
  }, [layer, zIndex, defaults]);
  return renderLayer(layer, props);
}

export interface MarkerProps extends LayerProps<L.Marker, L.MarkerOptions> {
  position: L.LatLngExpression;
  opacity?: number;
  draggable?: boolean;
  zIndexOffset?: number;
}

export function Marker(props: MarkerProps) {
  const { position, options, opacity, draggable, zIndexOffset } = props;
  const [defaults] = useState(() => ({
    opacity: options?.opacity ?? 1,
    draggable: options?.draggable ?? false,
    zIndexOffset: options?.zIndexOffset ?? 0,
  }));
  const layer = useLayer((L) => L.marker(position, options));
  useEffect(() => {
    layer?.setLatLng(position);
  }, [layer, position]);
  useEffect(() => {
    layer?.setOpacity(opacity ?? defaults.opacity);
  }, [layer, opacity, defaults]);
  useEffect(() => {
    layer?.setZIndexOffset(zIndexOffset ?? defaults.zIndexOffset);
  }, [layer, zIndexOffset, defaults]);
  useEffect(() => {
    if (draggable ?? defaults.draggable) layer?.dragging?.enable();
    else layer?.dragging?.disable();
  }, [layer, draggable, defaults]);
  return renderLayer(layer, props);
}

interface PathProps<T extends L.Path, O extends L.PathOptions = L.PathOptions>
  extends LayerProps<T, O> {
  /** Mutable path style. Omitted style keys return to their creation values. */
  pathOptions?: L.PathOptions;
}

function usePathStyle(layer: L.Path | null, style?: L.PathOptions) {
  const initial = useMemo(() => {
    if (!layer) return null;
    // Leaflet stores defaults on the options prototype; include inherited keys.
    const options: Record<string, unknown> = {};
    for (const key in layer.options)
      options[key] = layer.options[key as keyof L.PathOptions];
    // CircleMarker.setStyle also accepts radius internally; the radius prop owns it.
    delete options.radius;
    return options as L.PathOptions;
  }, [layer]);
  useEffect(() => {
    if (layer && initial) layer.setStyle({ ...initial, ...style });
  }, [layer, initial, style]);
}

export interface PolylineProps
  extends PathProps<L.Polyline, L.PolylineOptions> {
  positions: L.LatLngExpression[] | L.LatLngExpression[][];
}

export function Polyline(props: PolylineProps) {
  const layer = useLayer((L) => L.polyline(props.positions, props.options));
  useEffect(() => {
    layer?.setLatLngs(props.positions);
  }, [layer, props.positions]);
  usePathStyle(layer, props.pathOptions);
  return renderLayer(layer, props);
}

export interface PolygonProps extends PathProps<L.Polygon, L.PolylineOptions> {
  positions:
    | L.LatLngExpression[]
    | L.LatLngExpression[][]
    | L.LatLngExpression[][][];
}

export function Polygon(props: PolygonProps) {
  const layer = useLayer((L) => L.polygon(props.positions, props.options));
  useEffect(() => {
    layer?.setLatLngs(props.positions);
  }, [layer, props.positions]);
  usePathStyle(layer, props.pathOptions);
  return renderLayer(layer, props);
}

export interface CircleProps
  extends PathProps<L.Circle, L.CircleMarkerOptions> {
  center: L.LatLngExpression;
  radius: number;
}

export function Circle(props: CircleProps) {
  const layer = useLayer((L) =>
    L.circle(props.center, { ...props.options, radius: props.radius }),
  );
  useEffect(() => {
    layer?.setLatLng(props.center);
  }, [layer, props.center]);
  useEffect(() => {
    layer?.setRadius(props.radius);
  }, [layer, props.radius]);
  usePathStyle(layer, props.pathOptions);
  return renderLayer(layer, props);
}

export interface CircleMarkerProps
  extends PathProps<L.CircleMarker, L.CircleMarkerOptions> {
  center: L.LatLngExpression;
  radius?: number;
}

export function CircleMarker(props: CircleMarkerProps) {
  const [initialRadius] = useState(() => props.options?.radius ?? 10);
  const layer = useLayer((L) => L.circleMarker(props.center, props.options));
  useEffect(() => {
    layer?.setLatLng(props.center);
  }, [layer, props.center]);
  useEffect(() => {
    layer?.setRadius(props.radius ?? initialRadius);
  }, [layer, props.radius, initialRadius]);
  usePathStyle(layer, props.pathOptions);
  return renderLayer(layer, props);
}

export interface RectangleProps extends PathProps<L.Rectangle> {
  bounds: L.LatLngBoundsExpression;
}

export function Rectangle(props: RectangleProps) {
  const layer = useLayer((L) => L.rectangle(props.bounds, props.options));
  useEffect(() => {
    layer?.setBounds(props.bounds);
  }, [layer, props.bounds]);
  usePathStyle(layer, props.pathOptions);
  return renderLayer(layer, props);
}

export type LayerGroupProps = LayerProps<L.LayerGroup, L.LayerOptions>;

export function LayerGroup(props: LayerGroupProps) {
  const layer = useLayer((L) => L.layerGroup([], props.options));
  return layer ? (
    <LayerContainerContext value={layer}>
      {renderLayer(layer, props)}
    </LayerContainerContext>
  ) : null;
}

export type FeatureGroupProps = LayerProps<L.FeatureGroup, L.LayerOptions>;

export function FeatureGroup(props: FeatureGroupProps) {
  const layer = useLayer((L) => L.featureGroup([], props.options));
  return layer ? (
    <LayerContainerContext value={layer}>
      {renderLayer(layer, props)}
    </LayerContainerContext>
  ) : null;
}

export interface GeoJSONProps extends LayerProps<L.GeoJSON, L.GeoJSONOptions> {
  data: Parameters<typeof L.geoJSON>[0];
  pathOptions?: L.PathOptions;
}

/** Replaces features when data identity changes; memoize large datasets. */
export function GeoJSON(props: GeoJSONProps) {
  const layer = useLayer((L) => L.geoJSON(undefined, props.options));
  useEffect(() => {
    if (!layer) return;
    layer.clearLayers();
    if (Array.isArray(props.data)) {
      for (const feature of props.data) layer.addData(feature);
    } else if (props.data) layer.addData(props.data);
  }, [layer, props.data]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: Reapply styles after the preceding effect replaces GeoJSON features.
  useEffect(() => {
    layer?.resetStyle();
    if (props.pathOptions) layer?.setStyle(props.pathOptions);
  }, [layer, props.data, props.pathOptions]);
  return renderLayer(layer, props);
}

export interface ImageOverlayProps
  extends LayerProps<L.ImageOverlay, L.ImageOverlayOptions> {
  url: string;
  bounds: L.LatLngBoundsExpression;
  opacity?: number;
  zIndex?: number;
}

export function ImageOverlay(props: ImageOverlayProps) {
  const { leaflet } = useMapContext();
  const [defaults] = useState(() => ({
    opacity: props.options?.opacity ?? 1,
    zIndex: props.options?.zIndex ?? 1,
  }));
  const layer = useLayer((L) =>
    L.imageOverlay(props.url, props.bounds, props.options),
  );
  useEffect(() => {
    layer?.setUrl(props.url);
  }, [layer, props.url]);
  useEffect(() => {
    const bounds =
      props.bounds instanceof leaflet.LatLngBounds
        ? props.bounds
        : leaflet.latLngBounds(props.bounds);
    layer?.setBounds(bounds);
  }, [layer, leaflet, props.bounds]);
  useEffect(() => {
    layer?.setOpacity(props.opacity ?? defaults.opacity);
  }, [layer, props.opacity, defaults]);
  useEffect(() => {
    layer?.setZIndex(props.zIndex ?? defaults.zIndex);
  }, [layer, props.zIndex, defaults]);
  return renderLayer(layer, props);
}
