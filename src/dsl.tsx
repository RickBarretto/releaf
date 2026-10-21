"use client"

import type * as Leaflet from "leaflet"
import type { ComponentPropsWithoutRef, ReactElement } from "react"
import {
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useState,
} from "react"
import { createPortal } from "react-dom"
import { Button } from "./components/ui/button"
import { useMap, useMapContext } from "./context"
import type { MarkerProps, TileLayerProps } from "./layers"
import { Marker, TileLayer } from "./layers"
import { cn } from "./lib/utils"
import { MapContainer } from "./map"
import type { PopupProps, TooltipProps } from "./overlays"
import { Popup, Tooltip } from "./overlays"
import { getRotationState, Rotation } from "./rotation"
import { SearchBar } from "./search"

export type { RotationProps } from "./rotation"

/** Geographic coordinates in degrees, independent of Leaflet tuple ordering. */
export interface Position {
  latitude: number
  longitude: number
}

export type PositionExpression = Position | Leaflet.LatLngExpression

/** Normalize named coordinates while preserving native Leaflet inputs. */
export function toLatLng(
  position: PositionExpression,
): Leaflet.LatLngExpression {
  return "latitude" in position
    ? [position.latitude, position.longitude]
    : position
}

/** Stable imperative actions for the current map. Rotation requires <Map.Rotation>. */
export function useController() {
  const map = useMap()

  return useMemo(
    () => ({
      native: map,
      zoomIn: (delta?: number) => map.zoomIn(delta),
      zoomOut: (delta?: number) => map.zoomOut(delta),
      flyTo: (
        position: PositionExpression,
        zoom?: number,
        options?: Leaflet.ZoomPanOptions,
      ) => map.flyTo(toLatLng(position), zoom, options),
      fitBounds: (
        positions: readonly PositionExpression[],
        options?: Leaflet.FitBoundsOptions,
      ) =>
        map.fitBounds(
          positions.map(toLatLng) as Leaflet.LatLngTuple[],
          options,
        ),
      rotateBy: (degrees: number) => {
        getRotationState(map).turn(degrees)
      },
      resetNorth: () => {
        getRotationState(map).turn(null)
      },
    }),
    [map],
  )
}

export interface ViewProps {
  position: PositionExpression
  zoom?: number
  animate?: boolean
}

function View({ position, zoom, animate = false }: ViewProps) {
  const { map, leaflet } = useMapContext()
  const { lat, lng } = leaflet.latLng(toLatLng(position))

  useEffect(() => {
    map.setView([lat, lng], zoom ?? map.getZoom(), { animate })
  }, [map, lat, lng, zoom, animate])

  return null
}

export interface ZoomProps {
  zoom: number
  minZoom?: number
  maxZoom?: number
}

function Zoom({ zoom, minZoom, maxZoom }: ZoomProps) {
  const map = useMap()

  useEffect(() => {
    const previous = { min: map.options.minZoom, max: map.options.maxZoom }
    map.setMinZoom(minZoom ?? 0)
    map.setMaxZoom(maxZoom ?? Infinity)

    return () => {
      map.setMinZoom(previous.min ?? 0)
      map.setMaxZoom(previous.max ?? Infinity)
    }
  }, [map, minZoom, maxZoom])

  useEffect(() => {
    map.setZoom(zoom)
  }, [map, zoom])

  return null
}

export interface ToolbarProps
  extends Omit<ComponentPropsWithoutRef<"div">, "style"> {
  /** Overrides corner flags; otherwise defaults to top right. */
  position?: Leaflet.ControlPosition
  top?: boolean
  bottom?: boolean
  left?: boolean
  right?: boolean
}

function Toolbar({
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
    ? createPortal(<div {...props}>{children}</div>, element)
    : null
}

export interface ActionProps
  extends Omit<ComponentPropsWithoutRef<"button">, "style"> {
  asChild?: boolean
}

/** Compose child, consumer, and built-in actions; preventDefault cancels later steps. */
function Action({
  children,
  asChild,
  onClick,
  run,
  ...props
}: ActionProps & { run: () => void }) {
  const click: NonNullable<ActionProps["onClick"]> = (event) => {
    onClick?.(event)
    if (!event.defaultPrevented) run()
  }
  if ((asChild || isValidElement(children)) && isValidElement(children)) {
    const child = children as ReactElement<ComponentPropsWithoutRef<"button">>

    return cloneElement(child, {
      ...props,
      className: cn(child.props.className, props.className),
      disabled: props.disabled ?? child.props.disabled,
      onClick: (event) => {
        child.props.onClick?.(event)
        if (
          !event.defaultPrevented &&
          !(props.disabled ?? child.props.disabled)
        )
          click(event)
      },
    })
  }

  return (
    <Button {...props} onClick={click}>
      {children}
    </Button>
  )
}

function ZoomIn(props: ActionProps) {
  const map = useController()

  return (
    <Action
      aria-label="Zoom in"
      title="Zoom in"
      {...props}
      run={() => map.zoomIn()}
    >
      {props.children ?? "+"}
    </Action>
  )
}

function ZoomOut(props: ActionProps) {
  const map = useController()

  return (
    <Action
      aria-label="Zoom out"
      title="Zoom out"
      {...props}
      run={() => map.zoomOut()}
    >
      {props.children ?? "−"}
    </Action>
  )
}

function ResetNorth(props: ActionProps) {
  const map = useController()

  return (
    <Action
      aria-label="Reset north"
      title="Reset north"
      {...props}
      run={map.resetNorth}
    >
      {props.children ?? "Reset north"}
    </Action>
  )
}

export interface LocateProps extends ActionProps {
  options?: Leaflet.LocateOptions
}

function Locate({ options, ...props }: LocateProps) {
  const map = useMap()

  return (
    <Action
      aria-label="Locate me"
      title="Locate me"
      {...props}
      run={() => map.locate({ setView: true, ...options })}
    >
      {props.children ?? "Locate me"}
    </Action>
  )
}

export interface FlyToProps extends ActionProps {
  position: PositionExpression
  zoom?: number
  options?: Leaflet.ZoomPanOptions
}

function FlyTo({ position, zoom, options, ...props }: FlyToProps) {
  const map = useController()

  return (
    <Action
      aria-label="Go to location"
      title="Go to location"
      {...props}
      run={() => map.flyTo(position, zoom, options)}
    >
      {props.children ?? "Go to location"}
    </Action>
  )
}

export interface DSLMarkerProps extends Omit<MarkerProps, "position"> {
  position: PositionExpression
}

function DSLMarker({ position, ...props }: DSLMarkerProps) {
  return <Marker {...props} position={toLatLng(position)} />
}

function DSLPopup({
  position,
  ...props
}: Omit<PopupProps, "position"> & { position?: PositionExpression }) {
  return <Popup {...props} position={position && toLatLng(position)} />
}

function DSLTooltip({
  position,
  ...props
}: Omit<TooltipProps, "position"> & { position?: PositionExpression }) {
  return <Tooltip {...props} position={position && toLatLng(position)} />
}

export interface CustomTilesProps
  extends TileLayerProps,
    Leaflet.TileLayerOptions {}

/** Explicit options override shorthand tile options at creation. */
function CustomTiles({
  url,
  options,
  children,
  ref,
  eventHandlers,
  ...rest
}: CustomTilesProps) {
  return (
    <TileLayer
      {...rest}
      url={url}
      ref={ref}
      eventHandlers={eventHandlers}
      options={{ ...rest, ...options }}
    >
      {children}
    </TileLayer>
  )
}

function OpenStreetMap(props: Omit<CustomTilesProps, "url">) {
  return (
    <CustomTiles
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      maxZoom={19}
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      {...props}
    />
  )
}

const ReleafMap = {
  Root: MapContainer,
  View,
  Zoom,
  Rotation,
  Toolbar,
  Marker: DSLMarker,
  Popup: DSLPopup,
  Tooltip: DSLTooltip,
  Tiles: { OpenStreetMap, Custom: CustomTiles },
  Actions: { ZoomIn, ZoomOut, Locate, ResetNorth, FlyTo },
  SearchBar,
  useController,
}

export { ReleafMap as Map }
