"use client"

import type { ReactNode } from "react"
import { useEffect, useId, useRef, useState } from "react"
import {
  type SearchBarProps,
  SearchContext,
  type SearchPlace,
  type SearchState,
} from "./shared"

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
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<readonly T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [active, setActive] = useState(-1)
  const [selected, setSelected] = useState<string | null>(null)
  const id = useId()
  const callbacks = useRef({ search, onSelect, getLabel })

  // Callback identity changes must not restart the current debounce or request.
  useEffect(() => {
    callbacks.current = { search, onSelect, getLabel }
  })

  useEffect(() => {
    const controller = new AbortController()
    setResults([])
    setActive(-1)
    setError(null)
    setLoading(false)
    // Selecting a result updates the input without searching for its label again.
    if (query.trim().length < minLength || query === selected) return

    setLoading(true)
    const timer = setTimeout(() => {
      void Promise.resolve()
        .then(() => callbacks.current.search(query, controller.signal))
        .then(
          // Check cancellation even when the provider ignores its AbortSignal.
          (items) => {
            if (!controller.signal.aborted) {
              setResults(items)
              setLoading(false)
            }
          },
          (cause) => {
            if (!controller.signal.aborted) {
              setError(cause)
              setLoading(false)
            }
          },
        )
    }, debounceMs)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, minLength, debounceMs, selected])

  const label = (place: T) =>
    callbacks.current.getLabel
      ? callbacks.current.getLabel(place)
      : (place as SearchPlace).label
  const state: SearchState = {
    query,
    setQuery: (value) => {
      setSelected(null)
      setQuery(value)
    },
    results,
    label: (place) => label(place as T),
    select: (place) => {
      const text = label(place as T)
      setSelected(text)
      setQuery(text)
      setResults([])
      setActive(-1)
      callbacks.current.onSelect(place as T)
    },
    loading,
    showEmpty: query.trim().length >= minLength && query !== selected,
    error,
    id,
    active,
    setActive,
  }

  return (
    <SearchContext value={state}>
      <div {...props}>{children}</div>
    </SearchContext>
  )
}
