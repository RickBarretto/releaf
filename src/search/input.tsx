"use client"

import type { ComponentPropsWithoutRef } from "react"
import { Input as UIInput } from "../components/ui/input"
import { useSearch } from "./shared"

/**
 * Renders the SearchBar combobox and handles keyboard result navigation.
 *
 * Render inside SearchBar. Arrow keys move the active option, Enter selects it,
 * and Escape clears the query. Consumer handlers can cancel built-in behavior
 * with preventDefault().
 */
export function Input({
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
