"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"

type ClipboardState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "success" }
  | { status: "error"; error: unknown }

/** Feedback belongs to the current content and most recent copy attempt. */
export function useClipboard(content: string, resetAfterMs?: number) {
  const [state, setState] = useState<ClipboardState>({ status: "idle" })
  const [previousContent, setPreviousContent] = useState(content)
  const generation = useRef(0)
  if (previousContent !== content) {
    setPreviousContent(content)
    setState({ status: "idle" })
  }
  // biome-ignore lint/correctness/useExhaustiveDependencies: Each committed content change invalidates pending clipboard work.
  useLayoutEffect(() => {
    // Changing content, including A → B → A, invalidates old completions.
    generation.current += 1
    return () => {
      generation.current += 1
    }
  }, [content])
  useEffect(() => {
    if (
      resetAfterMs === undefined ||
      (state.status !== "success" && state.status !== "error")
    )
      return
    const id = generation.current
    const timer = setTimeout(() => {
      if (id === generation.current) setState({ status: "idle" })
    }, resetAfterMs)
    return () => clearTimeout(timer)
  }, [state, resetAfterMs])

  async function copy() {
    const id = ++generation.current
    setState({ status: "pending" })
    try {
      await navigator.clipboard.writeText(content)
      if (id === generation.current) setState({ status: "success" })
    } catch (error) {
      if (id === generation.current) setState({ status: "error", error })
    }
  }
  return { ...state, copy }
}
