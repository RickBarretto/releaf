"use client"

import type { ComponentPropsWithoutRef, ReactNode } from "react"
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react"
import { Input as UIInput } from "./components/ui/input"
import { cn } from "./lib/utils"

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

interface SearchState {
  query: string
  setQuery: (query: string) => void
  results: readonly unknown[]
  label: (place: unknown) => string
  select: (place: unknown) => void
  loading: boolean
  showEmpty: boolean
  error: unknown
  id: string
  active: number
  setActive: (index: number) => void
}

// The generic root owns typed values; compound children consume an erased context.
const SearchContext = createContext<SearchState | null>(null)

function useSearch() {
  const value = useContext(SearchContext)
  if (!value)
    throw new Error("SearchBar components must be inside <Map.SearchBar>.")

  return value
}

function Root<T extends SearchPlace>(props: SearchBarProps<T>): ReactNode
function Root<T>(
  props: SearchBarProps<T> & { getLabel: (place: T) => string },
): ReactNode
function Root<T>({
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

function Input({
  onChange,
  onKeyDown,
  ...props
}: Omit<ComponentPropsWithoutRef<"input">, "style">) {
  const state = useSearch()

  return (
    <UIInput
      aria-label="Search places"
      {...props}
      role="combobox"
      aria-autocomplete="list"
      aria-expanded={state.results.length > 0}
      aria-controls={state.id}
      aria-activedescendant={
        state.active >= 0 ? `${state.id}-${state.active}` : undefined
      }
      value={state.query}
      onChange={(event) => {
        onChange?.(event)
        if (!event.defaultPrevented) state.setQuery(event.target.value)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault()
          const count = state.results.length
          if (count) {
            const direction = event.key === "ArrowDown" ? 1 : -1
            // Starting above the first option makes the first arrow pick an endpoint.
            const current =
              state.active < 0 ? (direction === 1 ? -1 : 0) : state.active
            state.setActive((current + direction + count) % count)
          }
        } else if (event.key === "Enter" && state.active >= 0) {
          event.preventDefault()
          state.select(state.results[state.active])
        } else if (event.key === "Escape") {
          state.setQuery("")
        }
      }}
    />
  )
}

export interface SearchResultsProps
  extends Omit<ComponentPropsWithoutRef<"ul">, "style"> {
  loadingMessage?: ReactNode
  emptyMessage?: ReactNode
  errorMessage?: ReactNode
}

function Results({
  loadingMessage = "Searching…",
  emptyMessage = "No results",
  errorMessage = "Search failed",
  className,
  ...props
}: SearchResultsProps) {
  const state = useSearch()

  return (
    <>
      <div role="status" className="empty:hidden">
        {state.loading
          ? loadingMessage
          : state.error
            ? errorMessage
            : state.showEmpty && !state.results.length
              ? emptyMessage
              : null}
      </div>
      <ul
        {...props}
        data-slot="search-results"
        className={cn(
          "m-0 list-none space-y-1 p-0 text-sm empty:hidden text-foreground [&_[role=option]]:cursor-pointer [&_[role=option]]:rounded-md [&_[role=option]]:px-2 [&_[role=option]]:py-1.5 [&_[aria-selected=true]]:bg-accent [&_[aria-selected=true]]:text-accent-foreground",
          className,
        )}
        id={state.id}
        // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: The combobox controls this ARIA listbox via aria-activedescendant.
        role="listbox"
        aria-label="Search results"
        aria-busy={state.loading}
      >
        {state.results.map((place, index) => (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: Generic results may have duplicate labels and no IDs; options contain no local state.
            key={index}
            id={`${state.id}-${index}`}
            // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: These list items are ARIA options controlled by the combobox.
            role="option"
            tabIndex={-1}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                state.select(place)
              }
            }}
            aria-selected={state.active === index}
            onMouseDown={(event) => event.preventDefault()}
            onMouseMove={() => state.setActive(index)}
            onClick={() => state.select(place)}
          >
            {state.label(place)}
          </li>
        ))}
      </ul>
    </>
  )
}

/** Provider-independent search with an accessible input and results list. */
export const SearchBar = Object.assign(Root, { Input, Results })
