"use client"

import { Input } from "./search/input"
import { Results } from "./search/results"
import { Root } from "./search/root"

/**
 * Provider-independent search with compound Input and Results components.
 *
 * Supply search(query, signal) and onSelect. Searches are debounced by 250 ms
 * by default and stale requests are aborted. Results with no label field require
 * getLabel. Render Input and Results as children; no map context is required.
 *
 * @example
 * ```tsx
 * <SearchBar search={searchPlaces} onSelect={selectPlace}>
 *   <SearchBar.Input placeholder="Find a place" />
 *   <SearchBar.Results emptyMessage="No places found" />
 * </SearchBar>
 * ```
 */
export const SearchBar = Object.assign(Root, { Input, Results })

export type {
  SearchBarProps,
  SearchPlace,
  SearchResultsProps,
} from "./search/shared"
