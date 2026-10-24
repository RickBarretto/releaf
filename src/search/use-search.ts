"use client"

import { useEffect, useRef, useState } from "react"
import type { SearchBarProps, SearchPlace } from "./shared"

type Result<T> = { place: T; key: number }
type SearchRequest<T> = { query: string } & (
  | { status: "idle" }
  | { status: "pending" }
  | { status: "success"; results: readonly Result<T>[]; active: number }
  | { status: "error"; error: unknown }
  | { status: "selected"; result: Result<T> }
)

/** Owns each query and its results as one transition, including debounce time. */
export function useSearchRequest<T>({
  search,
  onSelect,
  getLabel,
  minLength = 1,
  debounceMs = 250,
}: SearchBarProps<T>) {
  const [state, setState] = useState<SearchRequest<T>>({
    status: "idle",
    query: "",
  })
  const callbacks = useRef({ search, onSelect, getLabel })
  const controller = useRef<AbortController | null>(null)
  const generation = useRef(0)
  const nextKey = useRef(0)
  const version = generation.current
  useEffect(() => {
    callbacks.current = { search, onSelect, getLabel }
  })
  const { query } = state
  const selected = state.status === "selected"
  useEffect(() => {
    if (selected || query.trim().length < minLength) {
      if (!selected) setState({ status: "idle", query })
      return
    }
    const request = new AbortController()
    controller.current = request
    const id = version
    setState({ status: "pending", query })
    const timer = setTimeout(() => {
      void Promise.resolve()
        .then(() => {
          if (request.signal.aborted) return []
          return callbacks.current.search(query, request.signal)
        })
        .then(
          (items) => {
            if (request.signal.aborted || id !== generation.current) return
            setState({
              status: "success",
              query,
              results: items.map((place) => ({
                place,
                key: nextKey.current++,
              })),
              active: -1,
            })
          },
          (error) => {
            if (request.signal.aborted || id !== generation.current) return
            setState({ status: "error", query, error })
          },
        )
    }, debounceMs)
    return () => {
      clearTimeout(timer)
      request.abort()
    }
  }, [query, selected, minLength, debounceMs, version])

  function invalidate() {
    generation.current += 1
    controller.current?.abort()
  }
  function label(place: T) {
    return callbacks.current.getLabel
      ? callbacks.current.getLabel(place)
      : (place as SearchPlace).label
  }
  return {
    state,
    label,
    setQuery(query: string) {
      invalidate()
      setState({
        status: query.trim().length < minLength ? "idle" : "pending",
        query,
      })
    },
    setActive(index: number) {
      if (version !== generation.current) return
      setState((current) =>
        current.status === "success" &&
        index >= 0 &&
        index < current.results.length
          ? { ...current, active: index }
          : current,
      )
    },
    select(key: number) {
      if (version !== generation.current || state.status !== "success") return
      const result = state.results.find((result) => result.key === key)
      if (!result) return
      invalidate()
      setState({ status: "selected", query: label(result.place), result })
      callbacks.current.onSelect(result.place)
    },
  }
}
