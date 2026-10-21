"use client"

import type * as Leaflet from "leaflet"
import type { ComponentPropsWithoutRef, ReactNode } from "react"
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react"
import { MapIcon } from "./components/map-icon"
import { Button } from "./components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./components/ui/tooltip"
import { useMap } from "./context"
import type { Position, PositionExpression, ToolbarProps } from "./dsl-core"
import { MapPrimitives as ReleafMap, toLatLng } from "./dsl-core"
import { useMapEvents } from "./events"
import { cn } from "./lib/utils"
import { useLocationRequest } from "./location"
import type { SearchBarProps } from "./search"
import { SearchBar } from "./search"

const panel =
  "rounded-xl border border-border bg-background p-2 text-foreground shadow-lg"
const motion = () =>
  !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

export interface CoordinatesProps
  extends Omit<ComponentPropsWithoutRef<"section">, "style"> {
  position: Position | null
  precision?: number
  format?: (position: Position) => string
  copy?: boolean
}
export function Coordinates({
  position,
  precision = 5,
  format,
  copy = true,
  children,
  className,
  ...props
}: CoordinatesProps) {
  const text = position
    ? format
      ? format(position)
      : `${position.latitude.toFixed(precision)}, ${position.longitude.toFixed(precision)}`
    : "No location selected"
  const [status, setStatus] = useState("")
  const version = useRef(0)
  // biome-ignore lint/correctness/useExhaustiveDependencies: Changing displayed text invalidates clipboard feedback.
  useEffect(() => {
    version.current += 1
    setStatus("")
    return () => {
      version.current += 1
    }
  }, [text])
  async function copyText() {
    const id = ++version.current
    try {
      await navigator.clipboard.writeText(text)
      if (id === version.current) setStatus("Coordinates copied")
    } catch {
      if (id === version.current)
        setStatus(
          "Clipboard unavailable. Select and copy the coordinates above.",
        )
    }
  }
  return (
    <section
      data-slot="map-panel"
      className={cn(panel, "flex flex-col items-start gap-2", className)}
      {...props}
    >
      {children}
      <output className="block" aria-label="Latitude and longitude">
        {text}
      </output>
      {copy && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!position}
          onClick={copyText}
        >
          <MapIcon name="copy" />
          Copy coordinates
        </Button>
      )}
      <span role="status" className="block text-xs empty:hidden">
        {status}
      </span>
    </section>
  )
}

export interface LocationControlProps
  extends Omit<ComponentPropsWithoutRef<"div">, "style" | "onError"> {
  options?: PositionOptions
  compact?: boolean
  recenter?: boolean
  zoom?: number
  onSuccess?: (position: Position) => void
  onError?: (error: Error) => void
}
function LocationFeedback({
  status,
  error,
  request,
  compact = false,
  buttonProps,
}: {
  buttonProps?: Omit<
    ComponentPropsWithoutRef<"button">,
    "onClick" | "children" | "style"
  >
  compact?: boolean
  status: string
  error: Error | null
  request: () => void
}) {
  return (
    <>
      <Button
        {...buttonProps}
        type="button"
        variant={compact ? "ghost" : "secondary"}
        size={compact ? "icon" : "default"}
        aria-label={
          compact
            ? error
              ? "Retry current location"
              : "Locate me"
            : buttonProps?.["aria-label"]
        }
        title={
          compact
            ? status === "pending"
              ? "Finding your location…"
              : error
                ? "Retry current location"
                : "Locate me"
            : buttonProps?.title
        }
        aria-busy={status === "pending"}
        disabled={status === "pending" || buttonProps?.disabled}
        onClick={request}
      >
        <MapIcon name="locate" />
        {!compact &&
          (status === "pending"
            ? "Finding your location…"
            : error
              ? "Retry current location"
              : "Use current location")}
      </Button>
      {compact ? (
        (status === "pending" || error) && (
          <ReleafMap.Toolbar bottom left>
            <div
              data-slot="map-panel"
              className={cn(panel, "w-64 max-w-[calc(100vw-2rem)] text-sm")}
              role={error ? "alert" : "status"}
            >
              {error
                ? `${error.message} Use Locate me to try again.`
                : "Finding your location… Allow location access when your browser asks."}
            </div>
          </ReleafMap.Toolbar>
        )
      ) : (
        <>
          <span role="status" className="block text-xs empty:hidden">
            {status === "pending"
              ? "Allow location access when your browser asks."
              : ""}
          </span>
          {error && (
            <p role="alert" className="m-0 text-sm">
              {error.message} You can still search or choose on the map.
            </p>
          )}
        </>
      )}
    </>
  )
}
export function LocationControl({
  options,
  compact = false,
  recenter = true,
  zoom = 16,
  onSuccess,
  onError,
  className,
  ...props
}: LocationControlProps) {
  const location = useLocationRequest()
  const map = useMap()
  const reportError = useEffectEvent((error: Error) => onError?.(error))
  useEffect(() => {
    if (location.error) reportError(location.error)
  }, [location.error])
  async function request() {
    const position = await location.request(options)
    if (!position) return
    if (recenter) map.setView(toLatLng(position), zoom, { animate: motion() })
    onSuccess?.(position)
  }
  return (
    <div
      data-slot="map-panel"
      className={cn(
        compact ? "size-9 shrink-0" : panel,
        "flex flex-col items-start gap-2",
        className,
      )}
      {...props}
    >
      <LocationFeedback
        {...location}
        compact={compact}
        request={() => {
          void request()
        }}
      />
    </div>
  )
}

export interface NavigationProps extends ToolbarProps {
  orientation?: "vertical" | "horizontal"
  home?: PositionExpression
  zoom?: number
  locate?: boolean
  positions?: readonly PositionExpression[]
  fitOptions?: Leaflet.FitBoundsOptions
}
export function Navigation({
  orientation = "vertical",
  home,
  zoom,
  locate = false,
  positions,
  fitOptions,
  children,
  className,
  ...props
}: NavigationProps) {
  function tip(label: string, child: ReactNode) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{child}</TooltipTrigger>
        <TooltipContent className="z-[1100]">{label}</TooltipContent>
      </Tooltip>
    )
  }
  return (
    <ReleafMap.Toolbar {...props}>
      <TooltipProvider>
        <div
          data-slot="map-panel"
          className={cn(
            panel,
            "flex gap-1",
            orientation === "vertical" && "flex-col",
            className,
          )}
        >
          {children ?? (
            <>
              {tip("Zoom in", <ReleafMap.Actions.ZoomIn />)}
              {tip("Zoom out", <ReleafMap.Actions.ZoomOut />)}
              {home &&
                tip(
                  "Go home",
                  <ReleafMap.Actions.FlyTo
                    position={home}
                    zoom={zoom}
                    aria-label="Go home"
                    title="Go home"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Go home"
                      title="Go home"
                    >
                      <MapIcon name="pin" />
                    </Button>
                  </ReleafMap.Actions.FlyTo>,
                )}
              {locate && <LocationControl compact recenter zoom={zoom} />}
              {positions &&
                tip(
                  "Fit markers",
                  <ReleafMap.Actions.FitBounds
                    positions={positions}
                    options={fitOptions}
                  >
                    <Button type="button" variant="ghost" size="icon">
                      <MapIcon name="fit" />
                    </Button>
                  </ReleafMap.Actions.FitBounds>,
                )}
            </>
          )}
        </div>
      </TooltipProvider>
    </ReleafMap.Toolbar>
  )
}

export interface LayerItemProps {
  value: string
  label: ReactNode
  children: ReactNode
}
function LayerItem({ children }: LayerItemProps) {
  return children
}
export interface LayerSwitcherProps
  extends Omit<
    ComponentPropsWithoutRef<"div">,
    "style" | "defaultValue" | "onChange"
  > {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}
function Switcher({
  value,
  defaultValue,
  onValueChange,
  children,
  className,
  ...props
}: LayerSwitcherProps) {
  const items = Children.toArray(children).filter(
    isValidElement<LayerItemProps>,
  )
  const [internal, setInternal] = useState(
    defaultValue ?? items[0]?.props.value,
  )
  const active = value === undefined ? internal : value
  return (
    <>
      <div
        data-slot="map-panel"
        role="toolbar"
        aria-label="Map layers"
        className={cn(panel, "flex gap-1", className)}
        {...props}
      >
        {items.map((item) => (
          <Button
            type="button"
            key={item.props.value}
            variant={active === item.props.value ? "default" : "ghost"}
            aria-pressed={active === item.props.value}
            onClick={() => {
              if (value === undefined) setInternal(item.props.value)
              onValueChange?.(item.props.value)
            }}
          >
            {item.props.label}
          </Button>
        ))}
      </div>
      {items.find((item) => item.props.value === active)}
    </>
  )
}
export const LayerSwitcher = Object.assign(Switcher, { Item: LayerItem })

export interface MapSearchProps<T> extends Omit<SearchBarProps<T>, "onSelect"> {
  getPosition: (result: T) => Position
  onSelect?: (result: T) => void
  zoom?: number
  marker?: boolean
  placeholder?: string
}
export function MapSearch<T extends { label: string }>(
  props: MapSearchProps<T>,
): ReactNode
export function MapSearch<T>(
  props: MapSearchProps<T> & { getLabel: (result: T) => string },
): ReactNode
export function MapSearch<T>({
  getPosition,
  onSelect,
  zoom = 13,
  marker = true,
  placeholder = "Find a location",
  children,
  ...props
}: MapSearchProps<T>) {
  const map = useMap()
  const [selected, setSelected] = useState<Position | null>(null)
  return (
    <>
      <SearchBar
        {...props}
        getLabel={
          props.getLabel ?? ((result: T) => (result as { label: string }).label)
        }
        onSelect={(result) => {
          const position = getPosition(result)
          setSelected(position)
          map.setView(toLatLng(position), zoom, { animate: motion() })
          onSelect?.(result)
        }}
      >
        {children ?? (
          <>
            <SearchBar.Input placeholder={placeholder} />
            <SearchBar.Results />
          </>
        )}
      </SearchBar>
      {marker && selected && <ReleafMap.Marker position={selected} />}
    </>
  )
}

export type SelectionSource =
  | "Initial location"
  | "Map click"
  | "Marker drag"
  | "Search result"
  | "Current location"
  | "External value"
export interface SelectionDetails {
  source: SelectionSource
}
export interface LocationPickerProps {
  value?: Position | null
  defaultValue?: Position | null
  onValueChange?: (value: Position | null, details: SelectionDetails) => void
  children?: ReactNode
  zoom?: number
  locationOptions?: PositionOptions
}
interface PickerState {
  value: Position | null
  source: SelectionSource
  select: (
    position: Position | null,
    source?: SelectionSource,
    recenter?: boolean,
  ) => void
  locate: () => Promise<void>
  status: ReturnType<typeof useLocationRequest>["status"]
  error: Error | null
}
const PickerContext = createContext<PickerState | null>(null)
export function useLocationPicker() {
  const state = useContext(PickerContext)
  if (!state)
    throw new Error("useLocationPicker must be inside Map.LocationPicker")
  return state
}
function PickerRoot({
  value,
  defaultValue = null,
  onValueChange,
  children,
  zoom = 13,
  locationOptions,
}: LocationPickerProps) {
  const [internal, setInternal] = useState(defaultValue)
  const selected = value === undefined ? internal : value
  const [source, setSource] = useState<SelectionSource>("Initial location")
  const location = useLocationRequest()
  const map = useMap()
  const [pendingCamera, setPendingCamera] = useState<Position | null>(null)
  const selectedKey = selected
    ? `${selected.latitude},${selected.longitude}`
    : ""
  const previousKey = useRef(selectedKey)
  const proposedKey = useRef<string | null>(null)
  function select(
    position: Position | null,
    nextSource: SelectionSource = "External value",
    recenter = false,
  ) {
    location.reset()
    proposedKey.current = position
      ? `${position.latitude},${position.longitude}`
      : ""
    setPendingCamera(recenter ? position : null)
    if (value === undefined) setInternal(position)
    setSource(nextSource)
    onValueChange?.(position, { source: nextSource })
  }
  useEffect(() => {
    if (previousKey.current !== selectedKey) {
      location.reset()
      if (proposedKey.current !== selectedKey) setSource("External value")
      previousKey.current = selectedKey
    }
    proposedKey.current = null
  }, [selectedKey, location.reset])
  useEffect(() => {
    const target = pendingCamera
    if (
      target &&
      selected &&
      target.latitude === selected.latitude &&
      target.longitude === selected.longitude
    ) {
      map.setView(toLatLng(selected), zoom, { animate: motion() })
    }
    if (pendingCamera) setPendingCamera(null)
  }, [pendingCamera, selected, map, zoom])
  useMapEvents({ click: (event) => select(event.position, "Map click") })
  async function locate() {
    const position = await location.request(locationOptions)
    if (position) select(position, "Current location", true)
  }
  return (
    <PickerContext
      value={{
        value: selected,
        source,
        select,
        locate,
        status: location.status,
        error: location.error,
      }}
    >
      {children ?? (
        <>
          <PickerMarker />
          <ReleafMap.Toolbar
            top
            left
            data-slot="map-panel"
            className={cn(panel, "flex flex-col items-start gap-2")}
          >
            <PickerLocate />
          </ReleafMap.Toolbar>
          <ReleafMap.Toolbar bottom left>
            <PickerCoordinates />
          </ReleafMap.Toolbar>
        </>
      )}
    </PickerContext>
  )
}
function PickerMarker() {
  const picker = useLocationPicker()
  return (
    picker.value && (
      <ReleafMap.Marker
        position={picker.value}
        draggable
        options={{
          autoPan: true,
          title: "Drag to select a location",
          alt: "Selected location",
        }}
        eventHandlers={{
          dragend: (event) => {
            const marker = event.target as Leaflet.Marker
            const position = marker.getLatLng()
            // Restore the authoritative value until React accepts this drag.
            if (picker.value) marker.setLatLng(toLatLng(picker.value))
            picker.select(
              { latitude: position.lat, longitude: position.lng },
              "Marker drag",
            )
          },
        }}
      >
        <ReleafMap.Tooltip>Drag me to refine your selection</ReleafMap.Tooltip>
      </ReleafMap.Marker>
    )
  )
}
function PickerLocate(
  props: Omit<
    ComponentPropsWithoutRef<"button">,
    "style" | "onClick" | "children"
  >,
) {
  const picker = useLocationPicker()
  return (
    <LocationFeedback
      {...picker}
      buttonProps={props}
      request={() => {
        void picker.locate()
      }}
    />
  )
}
function PickerCoordinates({
  children,
  ...props
}: Omit<CoordinatesProps, "position">) {
  const picker = useLocationPicker()
  return (
    <Coordinates
      aria-label="Selected coordinates"
      {...props}
      position={picker.value}
    >
      <p className="m-0 text-xs text-muted-foreground">{picker.source}</p>
      {children}
    </Coordinates>
  )
}
export type PickerSearchProps<T> = Omit<MapSearchProps<T>, "zoom" | "marker">
function PickerSearch<T extends { label: string }>(
  props: PickerSearchProps<T>,
): ReactNode
function PickerSearch<T>(
  props: PickerSearchProps<T> & { getLabel: (result: T) => string },
): ReactNode
function PickerSearch<T>({
  getPosition,
  onSelect,
  placeholder = "Find a location",
  children,
  ...props
}: PickerSearchProps<T>) {
  const picker = useLocationPicker()
  return (
    <SearchBar
      {...props}
      getLabel={
        props.getLabel ?? ((result: T) => (result as { label: string }).label)
      }
      onSelect={(result) => {
        picker.select(getPosition(result), "Search result", true)
        onSelect?.(result)
      }}
    >
      {children ?? (
        <>
          <SearchBar.Input placeholder={placeholder} />
          <SearchBar.Results />
        </>
      )}
    </SearchBar>
  )
}
export const LocationPicker = Object.assign(PickerRoot, {
  Marker: PickerMarker,
  Search: PickerSearch,
  Locate: PickerLocate,
  Coordinates: PickerCoordinates,
})
