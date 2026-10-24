"use client"

import type { ComponentPropsWithoutRef, ReactNode } from "react"
import { createContext, useContext } from "react"

export interface SearchPlace {
  id?: string | number
  label: string
}

export interface SearchBarProps<T>
  extends Omit<ComponentPropsWithoutRef<"div">, "onSelect" | "style"> {
  /** Receives the original query; aborts when it changes or the component unmounts. */
  search: (
    query: string,
    signal: AbortSignal,
  ) => readonly T[] | Promise<readonly T[]>
  onSelect: (place: T) => void
  /** Required for result types without a string label property. */
  getLabel?: (place: T) => string
  /** Minimum trimmed query length; defaults to 1. */
  minLength?: number
  /** Delay before searching, including the loading state; defaults to 250 ms. */
  debounceMs?: number
}

export interface SearchState {
  query: string
  setQuery: (query: string) => void
  results: readonly { place: unknown; key: number }[]
  label: (place: unknown) => string
  select: (key: number) => void
  loading: boolean
  showEmpty: boolean
  failed: boolean
  id: string
  active: number
  setActive: (index: number) => void
}

// The generic root owns typed values; compound children consume an erased context.
export const SearchContext = createContext<SearchState | null>(null)

export function useSearch() {
  const value = useContext(SearchContext)
  if (!value)
    throw new Error("SearchBar components must be inside <Map.SearchBar>.")

  return value
}

export interface SearchResultsProps
  extends Omit<ComponentPropsWithoutRef<"ul">, "style"> {
  loadingMessage?: ReactNode
  emptyMessage?: ReactNode
  errorMessage?: ReactNode
}
