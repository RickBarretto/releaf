"use client"

import type { ReactNode } from "react"
import { useId } from "react"
import { type SearchBarProps, SearchContext, type SearchPlace } from "./shared"

import { useSearchRequest } from "./use-search"

/**
 * Owns the typed query, asynchronous results, and context for SearchBar children.
 *
 * Accepts a search function and onSelect callback; getLabel is required for results
 * without a label. Searches are debounced and receive an AbortSignal. Query changes
 * and unmounting cancel stale requests. This component does not require a map.
 */
export function Root<T extends SearchPlace>(props: SearchBarProps<T>): ReactNode

export function Root<T>(
  props: SearchBarProps<T> & { getLabel: (place: T) => string },
): ReactNode

export function Root<T>({
  search,
  onSelect,
  getLabel,
  minLength = 1,
  debounceMs = 250,
  children,
  ...props
}: SearchBarProps<T>) {
  const request = useSearchRequest({
    search,
    onSelect,
    getLabel,
    minLength,
    debounceMs,
  })
  const id = useId()
  const { state } = request
  const context = {
    query: state.query,
    setQuery: request.setQuery,
    results: state.status === "success" ? state.results : [],
    label: (place: unknown) => request.label(place as T),
    select: request.select,
    loading: state.status === "pending",
    showEmpty: state.status === "success" && state.results.length === 0,
    failed: state.status === "error",
    id,
    active: state.status === "success" ? state.active : -1,
    setActive: request.setActive,
  }

  return (
    <SearchContext value={context}>
      <div {...props}>{children}</div>
    </SearchContext>
  )
}
