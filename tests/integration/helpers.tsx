import { setTimeout } from "node:timers/promises"
import { JSDOM } from "jsdom"
import type { ReactNode } from "react"
import { act } from "react"
import { vi } from "vitest"
export const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
})
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  SVGElement: dom.window.SVGElement,
  getComputedStyle: dom.window.getComputedStyle,
  IS_REACT_ACT_ENVIRONMENT: true,
})
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: dom.window.navigator,
})
Object.defineProperty(dom.window.SVGSVGElement.prototype, "createSVGRect", {
  value: () => ({}),
})
Object.defineProperty(dom.window.HTMLElement.prototype, "clientWidth", {
  get: () => 800,
})
Object.defineProperty(dom.window.HTMLElement.prototype, "clientHeight", {
  get: () => 400,
})

export const observers: Array<{ disconnected: boolean; callback: () => void }> =
  []
globalThis.ResizeObserver = class {
  entry = { disconnected: false, callback: () => this.callback() }
  constructor(private callback: () => void) {
    observers.push(this.entry)
  }
  observe() {}
  unobserve() {}
  disconnect() {
    this.entry.disconnected = true
  }
} as unknown as typeof ResizeObserver

const { createRoot } = await import("react-dom/client")
export let root: ReturnType<typeof createRoot> | undefined
export let host: HTMLDivElement
export async function render(node: ReactNode) {
  if (!root) {
    host = document.createElement("div")
    document.body.append(host)
    root = createRoot(host)
  }
  await act(async () => {
    root!.render(node)
  })
  await waitFor(() => {
    const containers = host.querySelectorAll(".leaflet-container")
    if (host.querySelector('div[style*="width: 100%"]') && !containers.length)
      throw new Error("Map not ready")
    if (containers.length && !containers[0].querySelector(".leaflet-pane"))
      throw new Error("Map not ready")
  })
}

export async function cleanup() {
  if (root) await act(async () => root!.unmount())
  root = undefined
  document.body.innerHTML = ""
  observers.length = 0
  vi.restoreAllMocks()
}

export async function waitFor(assertion: () => void, timeout = 2000) {
  const deadline = Date.now() + timeout
  for (;;) {
    try {
      assertion()
      return
    } catch (error) {
      if (Date.now() >= deadline) throw error
      await act(async () => {
        await setTimeout(5)
      })
    }
  }
}
export async function type(
  value: string,
  input = document.querySelector("input")!,
) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      dom.window.HTMLInputElement.prototype,
      "value",
    )!.set!.call(input, value)
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }))
  })
}
export async function click(element: Element) {
  await act(async () => {
    element.dispatchEvent(
      new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }),
    )
  })
}
export async function key(
  key: string,
  element = document.querySelector("input")!,
) {
  await act(async () => {
    element.dispatchEvent(
      new dom.window.KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
      }),
    )
  })
}

export async function unmount() {
  if (root) await act(async () => root!.unmount())
  root = undefined
}
