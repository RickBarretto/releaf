"use client"

import { Input } from "./search/input"
import { Results } from "./search/results"
import { Root } from "./search/root"

/** Provider-independent search with an accessible input and results list. */
export const SearchBar = Object.assign(Root, { Input, Results })

export type {
  SearchBarProps,
  SearchPlace,
  SearchResultsProps,
} from "./search/shared"
