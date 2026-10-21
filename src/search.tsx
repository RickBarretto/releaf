"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

export interface SearchPlace {
  id?: string | number;
  label: string;
}
export interface SearchBarProps<T>
  extends Omit<ComponentPropsWithoutRef<"div">, "onSelect"> {
  search: (
    query: string,
    signal: AbortSignal,
  ) => readonly T[] | Promise<readonly T[]>;
  onSelect: (place: T) => void;
  getLabel?: (place: T) => string;
  minLength?: number;
  debounceMs?: number;
}
interface SearchState {
  query: string;
  setQuery: (query: string) => void;
  results: readonly unknown[];
  label: (place: unknown) => string;
  select: (place: unknown) => void;
  loading: boolean;
  error: unknown;
  id: string;
  active: number;
  setActive: (index: number) => void;
}
const Context = createContext<SearchState | null>(null);
function useSearch() {
  const value = useContext(Context);
  if (!value)
    throw new Error("SearchBar components must be inside <Map.SearchBar>.");
  return value;
}
function Root<T extends SearchPlace>(props: SearchBarProps<T>): ReactNode;
function Root<T>(
  props: SearchBarProps<T> & { getLabel: (place: T) => string },
): ReactNode;
function Root<T>({
  search,
  onSelect,
  getLabel,
  minLength = 1,
  debounceMs = 250,
  children,
  ...props
}: SearchBarProps<T>) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [active, setActive] = useState(-1);
  const [selected, setSelected] = useState<string | null>(null);
  const id = useId();
  const callbacks = useRef({ search, onSelect, getLabel });
  useEffect(() => {
    callbacks.current = { search, onSelect, getLabel };
  });
  useEffect(() => {
    const controller = new AbortController();
    setResults([]);
    setActive(-1);
    setError(null);
    setLoading(false);
    if (query.trim().length < minLength || query === selected) return;
    setLoading(true);
    const timer = setTimeout(() => {
      void Promise.resolve()
        .then(() => callbacks.current.search(query, controller.signal))
        .then(
          (items) => {
            if (!controller.signal.aborted) {
              setResults(items);
              setLoading(false);
            }
          },
          (cause) => {
            if (!controller.signal.aborted) {
              setError(cause);
              setLoading(false);
            }
          },
        );
    }, debounceMs);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, minLength, debounceMs, selected]);
  const label = (place: T) =>
    callbacks.current.getLabel
      ? callbacks.current.getLabel(place)
      : (place as SearchPlace).label;
  const state: SearchState = {
    query,
    setQuery: (value) => {
      setSelected(null);
      setQuery(value);
    },
    results,
    label: (place) => label(place as T),
    select: (place) => {
      const text = label(place as T);
      setSelected(text);
      setQuery(text);
      setResults([]);
      setActive(-1);
      callbacks.current.onSelect(place as T);
    },
    loading,
    error,
    id,
    active,
    setActive,
  };
  return (
    <Context value={state}>
      <div {...props}>{children}</div>
    </Context>
  );
}
function Input({
  onChange,
  onKeyDown,
  ...props
}: ComponentPropsWithoutRef<"input">) {
  const state = useSearch();
  return (
    <input
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
        onChange?.(event);
        if (!event.defaultPrevented) state.setQuery(event.target.value);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          const count = state.results.length;
          if (count)
            state.setActive(
              (state.active +
                (event.key === "ArrowDown" ? 1 : count - 1) +
                count) %
                count,
            );
        } else if (event.key === "Enter" && state.active >= 0) {
          event.preventDefault();
          state.select(state.results[state.active]);
        } else if (event.key === "Escape") {
          state.setQuery("");
        }
      }}
    />
  );
}
export interface SearchResultsProps extends ComponentPropsWithoutRef<"ul"> {
  loadingMessage?: ReactNode;
  emptyMessage?: ReactNode;
  errorMessage?: ReactNode;
}
function Results({
  loadingMessage = "Searching…",
  emptyMessage = "No results",
  errorMessage = "Search failed",
  ...props
}: SearchResultsProps) {
  const state = useSearch();
  return (
    <>
      <div role="status">
        {state.loading
          ? loadingMessage
          : state.error
            ? errorMessage
            : state.query && !state.results.length
              ? emptyMessage
              : null}
      </div>
      <ul
        {...props}
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
                event.preventDefault();
                state.select(place);
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
  );
}
export const SearchBar = Object.assign(Root, { Input, Results });
