import { act } from "react"
import { afterEach, expect, test, vi } from "vitest"
import { useClipboard } from "../../src/lib/use-clipboard"
import { cleanup, render } from "./helpers"

afterEach(async () => {
  vi.useRealTimers()
  await cleanup()
  vi.unstubAllGlobals()
})

test("clipboard ignores old content, overlapping requests and completions after unmount", async () => {
  const requests: { resolve: () => void; reject: (error: unknown) => void }[] =
    []
  const writeText = vi.fn(
    () =>
      new Promise<void>((resolve, reject) =>
        requests.push({ resolve, reject }),
      ),
  )
  vi.stubGlobal("navigator", { clipboard: { writeText } })
  let clipboard!: ReturnType<typeof useClipboard>
  function Probe({ content }: { content: string }) {
    clipboard = useClipboard(content)
    return <span>{clipboard.status}</span>
  }
  await render(<Probe content="A" />)
  let first!: Promise<void>
  await act(async () => {
    first = clipboard.copy()
  })
  expect(clipboard.status).toBe("pending")
  await render(<Probe content="B" />)
  await render(<Probe content="A" />)
  await act(async () => {
    requests[0].resolve()
    await first
  })
  expect(clipboard.status).toBe("idle")
  let second!: Promise<void>
  await act(async () => {
    first = clipboard.copy()
    second = clipboard.copy()
  })
  await act(async () => {
    requests[2].reject(null)
    await second
  })
  expect(clipboard.status).toBe("error")
  await act(async () => {
    requests[1].resolve()
    await first
  })
  expect(clipboard.status).toBe("error")
  await act(async () => {
    first = clipboard.copy()
  })
  await render(null)
  await act(async () => {
    requests[3].resolve()
    await first
  })
  expect(writeText.mock.calls).toHaveLength(4)
})

test("clipboard clears feedback on content changes and resets timed feedback after completion", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal("navigator", { clipboard: { writeText } })
  let clipboard!: ReturnType<typeof useClipboard>
  function Probe({ content }: { content: string }) {
    clipboard = useClipboard(content, 2200)
    return <span>{clipboard.status}</span>
  }
  await render(<Probe content="first" />)
  vi.useFakeTimers()
  await act(async () => clipboard.copy())
  expect(clipboard.status).toBe("success")
  await act(async () => vi.advanceTimersByTime(2199))
  expect(clipboard.status).toBe("success")
  await act(async () => vi.advanceTimersByTime(1))
  expect(clipboard.status).toBe("idle")
  await act(async () => clipboard.copy())
  vi.useRealTimers()
  await render(<Probe content="second" />)
  expect(clipboard.status).toBe("idle")
  expect(writeText).toHaveBeenCalledWith("first")
})
