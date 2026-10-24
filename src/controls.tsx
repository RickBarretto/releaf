"use client"

import { LayerItem } from "./controls/layer-item"
import { PickerCoordinates } from "./controls/picker-coordinates"
import { PickerLocate } from "./controls/picker-locate"
import { PickerMarker } from "./controls/picker-marker"
import { PickerRoot } from "./controls/picker-root"
import { PickerSearch } from "./controls/picker-search"
import { Switcher } from "./controls/switcher"

export const LayerSwitcher = Object.assign(Switcher, { Item: LayerItem })

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
