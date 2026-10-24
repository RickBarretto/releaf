import type { ComponentPropsWithoutRef } from "react"

type MapIconName = "plus" | "minus" | "locate" | "pin" | "fit" | "copy"

/**
 * Renders one of the library’s small SVG map-control glyphs.
 *
 * Select a glyph with name and customize SVG attributes through props. Icons are
 * hidden from assistive technology by default; label the containing control.
 */
export function MapIcon({
  name,
  ...props
}: ComponentPropsWithoutRef<"svg"> & { name: MapIconName }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {name === "plus" && <path d="M12 5v14M5 12h14" />}
      {name === "minus" && <path d="M5 12h14" />}
      {name === "locate" && (
        <>
          <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
      {name === "pin" && (
        <>
          <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </>
      )}
      {name === "copy" && (
        <>
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </>
      )}
      {name === "fit" && <path d="M15 3h6v6m0-6-7 7M9 21H3v-6m0 6 7-7" />}
    </svg>
  )
}
