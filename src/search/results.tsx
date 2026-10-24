"use client"

import { cn } from "../lib/utils"
import { type SearchResultsProps, useSearch } from "./shared"

/**
 * Renders SearchBar status messages and its accessible selectable results list.
 *
 * Render inside SearchBar. Customize loading, empty, and error messages through
 * props; pointer interaction updates the same active option used by the input.
 */
export function Results({
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
