"use client"

import { LayerItem } from "./controls/layer-item"
import { PickerCoordinates } from "./controls/picker-coordinates"
import { PickerLocate } from "./controls/picker-locate"
import { PickerMarker } from "./controls/picker-marker"
import { PickerRoot } from "./controls/picker-root"
import { PickerSearch } from "./controls/picker-search"
import { Switcher } from "./controls/switcher"

/**
 * Selects one mounted layer set through labeled LayerSwitcher.Item children.
 *
 * Use value/onValueChange for controlled selection, or defaultValue for local
 * state. The first item is selected by default; inactive items are unmounted.
 *
 * @example
 * ```tsx
 * <LayerSwitcher defaultValue="streets">
 *   <LayerSwitcher.Item value="streets" label="Streets">
 *     <Map.Tiles.OpenStreetMap />
 *   </LayerSwitcher.Item>
 * </LayerSwitcher>
 * ```
 */
export const LayerSwitcher = Object.assign(Switcher, { Item: LayerItem })

/**
 * Selects a location by map click, marker drag, search, or browser geolocation.
 *
 * Render inside Map.Root. Use value/onValueChange for controlled selection or
 * defaultValue for local state. Omitted children render a marker, locate button,
 * and coordinate display; custom children can compose the compound components.
 *
 * @example
 * ```tsx
 * <LocationPicker defaultValue={{ latitude: -23.55, longitude: -46.63 }}>
 *   <LocationPicker.Marker />
 *   <Map.Toolbar bottom left>
 *     <LocationPicker.Coordinates />
 *     <LocationPicker.Locate />
 *   </Map.Toolbar>
 * </LocationPicker>
 * ```
 */
export const LocationPicker = Object.assign(PickerRoot, {
  Marker: PickerMarker,
  Search: PickerSearch,
  Locate: PickerLocate,
  Coordinates: PickerCoordinates,
})

export { Coordinates, type CoordinatesProps } from "./controls/coordinates"
export type { LayerItemProps } from "./controls/layer-item"
export {
  LocationControl,
  type LocationControlProps,
} from "./controls/location-control"
export { MapSearch, type MapSearchProps } from "./controls/map-search"
export { Navigation, type NavigationProps } from "./controls/navigation"
export type { PickerSearchProps } from "./controls/picker-search"
export {
  type LayerSwitcherProps,
  type LocationPickerProps,
  type SelectionDetails,
  type SelectionSource,
  useLocationPicker,
} from "./controls/shared"
