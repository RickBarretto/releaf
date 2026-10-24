"use client"

import { Copy, LocateFixed, MapPin, Maximize2, Minus, Plus } from "lucide-react"
import { createContext, type ReactNode, useContext } from "react"

const defaultIcons = {
  plus: <Plus aria-hidden="true" />,
  minus: <Minus aria-hidden="true" />,
  locate: <LocateFixed aria-hidden="true" />,
  pin: <MapPin aria-hidden="true" />,
  fit: <Maximize2 aria-hidden="true" />,
  copy: <Copy aria-hidden="true" />,
}

export type ReleafIcons = { [Name in keyof typeof defaultIcons]: ReactNode }

const IconsContext = createContext<ReleafIcons>(defaultIcons)

/** Supply icons from your app's icon library. Nested providers inherit overrides. */
export function IconProvider({
  icons,
  children,
}: {
  icons: Partial<ReleafIcons>
  children: ReactNode
}) {
  const inherited = useContext(IconsContext)
  return (
    <IconsContext.Provider value={{ ...inherited, ...icons }}>
      {children}
    </IconsContext.Provider>
  )
}

export function useIcons() {
  return useContext(IconsContext)
}
