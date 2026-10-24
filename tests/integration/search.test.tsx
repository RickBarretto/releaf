import { act, useLayoutEffect } from "react"
import { afterEach, describe, expect, test } from "vitest"
import { useSearch } from "../../src/search/shared"
import { cleanup, click, key, render, type, waitFor } from "./helpers"

afterEach(cleanup)

const { SearchBar } = await import("../../src/index")

describe("search contracts", () => {
  test("debounces, trims the minimum-length check, and cancels on unmount", async () => {
    const calls: string[] = []
    const signals: AbortSignal[] = []
    await render(
      <SearchBar
        minLength={2}
        debounceMs={30}
        search={(q, signal) => {
          calls.push(q)
          signals.push(signal)
          return new Promise<never>(() => {})
        }}
        onSelect={() => {}}
      >
        <SearchBar.Input />
        <SearchBar.Results />
      </SearchBar>,
    )
    expect(document.querySelector("input")?.getAttribute("data-slot")).toBe(
      "input",
    )
    await type(" ")
    await type("a")
    expect(calls).toEqual([])
    await type("ab")
    await type("abc")
    await waitFor(() => expect(calls).toEqual(["abc"]))
    await type("abcd")
    expect(signals[0].aborted).toBe(true)
    await waitFor(() => expect(calls).toEqual(["abc", "abcd"]))
    await render(null)
    expect(signals[1].aborted).toBe(true)
  })

  test("handles synchronous throws, rejected promises, recovery and custom messages", async () => {
    const search = (q: string) => {
      if (q === "throw") throw Error("sync")
      if (q === "reject") return Promise.reject(Error("async"))
      return [{ label: "Recovered" }]
    }
    await render(
      <SearchBar search={search} debounceMs={0} onSelect={() => {}}>
        <SearchBar.Input />
        <SearchBar.Results
          errorMessage="Failed"
          loadingMessage="Pending"
          emptyMessage="Empty"
        />
      </SearchBar>,
    )
    for (const value of ["throw", "reject"]) {
      await type(value)
      await waitFor(() =>
        expect(document.querySelector('[role="status"]')!.textContent).toBe(
          "Failed",
        ),
      )
    }
    await type("ok")
    await waitFor(() =>
      expect(document.querySelector('[role="option"]')!.textContent).toBe(
        "Recovered",
      ),
    )
    expect(
      document.querySelector('[role="listbox"]')!.getAttribute("aria-busy"),
    ).toBe("false")
  })

  test("custom labels, keyboard wrap, ARIA, pointer selection and Escape", async () => {
    const selected: unknown[] = []
    const items = [{ name: "One" }, { name: "Two" }]
    await render(
      <SearchBar
        search={() => items}
        getLabel={(p) => p.name}
        debounceMs={0}
        onSelect={(p) => selected.push(p)}
      >
        <SearchBar.Input />
        <SearchBar.Results />
      </SearchBar>,
    )
    await type("o")
    await waitFor(() =>
      expect(document.querySelectorAll('[role="option"]')).toHaveLength(2),
    )
    const input = document.querySelector("input")!
    expect(input.getAttribute("aria-controls")).toBe(
      document.querySelector('[role="listbox"]')!.id,
    )
    await key("ArrowUp")
    expect(input.getAttribute("aria-activedescendant")).toBe(
      document.querySelectorAll('[role="option"]')[1].id,
    )
    await key("ArrowDown")
    await key("ArrowUp")
    expect(input.getAttribute("aria-activedescendant")).toBe(
      document.querySelectorAll('[role="option"]')[1].id,
    )
    await key("Enter")
    expect(selected).toEqual([items[1]])
    expect(input.value).toBe("Two")
    expect(document.querySelector('[role="status"]')!.textContent).toBe("")
    expect(input.getAttribute("aria-expanded")).toBe("false")
    await type("o")
    await waitFor(() =>
      expect(document.querySelectorAll('[role="option"]')).toHaveLength(2),
    )
    await click(document.querySelector('[role="option"]')!)
    expect(selected).toEqual([items[1], items[0]])
    await key("Escape")
    expect(input.value).toBe("")
  })

  test("stale failures cannot overwrite current results and callbacks stay current", async () => {
    let reject!: (error: Error) => void
    const selections: string[] = []
    const tree = (label: string) => (
      <SearchBar
        debounceMs={0}
        search={(q) =>
          q === "old"
            ? new Promise<{ label: string }[]>((_, fail) => {
                reject = fail
              })
            : [{ label: "New" }]
        }
        onSelect={() => selections.push(label)}
      >
        <SearchBar.Input />
        <SearchBar.Results />
      </SearchBar>
    )
    await render(tree("before"))
    await type("old")
    await waitFor(() => expect(reject).toBeDefined())
    await type("new")
    await waitFor(() =>
      expect(document.querySelector('[role="option"]')!.textContent).toBe(
        "New",
      ),
    )
    await act(async () => reject(Error("stale")))
    await render(tree("after"))
    await click(document.querySelector('[role="option"]')!)
    expect(selections).toEqual(["after"])
  })
})

test("empty results, prevented input handlers and selection avoid extra searches", async () => {
  const calls: string[] = []
  const selected: string[] = []
  const tree = (blocked: boolean) => (
    <SearchBar
      debounceMs={0}
      search={(query) => {
        calls.push(query)
        return query === "none" ? [] : [{ label: "Chosen" }]
      }}
      onSelect={(p) => selected.push(p.label)}
    >
      <SearchBar.Input
        onChange={(e) => {
          if (blocked) e.preventDefault()
        }}
        onKeyDown={(e) => {
          if (blocked) e.preventDefault()
        }}
      />
      <SearchBar.Results emptyMessage="Nothing found" />
    </SearchBar>
  )
  await render(tree(true))
  await type("blocked")
  expect(document.querySelector("input")!.value).toBe("")
  expect(calls).toEqual([])
  await render(tree(false))
  await type("none")
  await waitFor(() =>
    expect(document.querySelector('[role="status"]')!.textContent).toBe(
      "Nothing found",
    ),
  )
  await type("find")
  await waitFor(() =>
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(1),
  )
  await render(tree(true))
  await key("ArrowDown")
  expect(
    document.querySelector("input")!.getAttribute("aria-activedescendant"),
  ).toBeNull()
  await render(tree(false))
  await key("ArrowDown")
  await key("Enter")
  expect(selected).toEqual(["Chosen"])
  expect(calls).toEqual(["none", "find"])
})

test("falsy provider rejections always display failure", async () => {
  await render(
    <SearchBar
      search={(query) =>
        Promise.reject([undefined, null, false, 0, ""][Number(query)])
      }
      debounceMs={0}
      onSelect={() => {}}
    >
      <SearchBar.Input />
      <SearchBar.Results />
    </SearchBar>,
  )
  for (const query of ["0", "1", "2", "3", "4"]) {
    await type(query)
    await waitFor(() =>
      expect(document.querySelector('[role="status"]')!.textContent).toBe(
        "Search failed",
      ),
    )
  }
})

test("query changes immediately invalidate active results and ignore obsolete successes", async () => {
  let finish!: (items: { label: string }[]) => void
  const snapshots: { query: string; count: number; active: number }[] = []
  function Probe() {
    const state = useSearch()
    useLayoutEffect(() => {
      snapshots.push({
        query: state.query,
        count: state.results.length,
        active: state.active,
      })
    })
    return null
  }
  const selections: unknown[] = []
  await render(
    <SearchBar
      search={(query) =>
        query === "slow"
          ? new Promise<{ label: string }[]>((resolve) => {
              finish = resolve
            })
          : [
              { label: "Duplicate", id: 1 },
              { label: "Duplicate", id: 1 },
            ]
      }
      debounceMs={0}
      onSelect={(place) => selections.push(place)}
    >
      <SearchBar.Input />
      <SearchBar.Results />
      <Probe />
    </SearchBar>,
  )
  await type("first")
  await waitFor(() =>
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(2),
  )
  await key("ArrowDown")
  await type("slow")
  expect(document.querySelectorAll('[role="option"]')).toHaveLength(0)
  expect(
    document.querySelector("input")!.getAttribute("aria-activedescendant"),
  ).toBeNull()
  expect(
    snapshots
      .filter((snapshot) => snapshot.query === "slow")
      .every((snapshot) => snapshot.count === 0 && snapshot.active === -1),
  ).toBe(true)
  await key("Enter")
  expect(selections).toEqual([])
  await waitFor(() => expect(finish).toBeDefined())
  await type("current")
  await waitFor(() =>
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(2),
  )
  await act(async () => finish([{ label: "Obsolete" }]))
  expect(document.querySelectorAll('[role="option"]')).toHaveLength(2)
  await key("ArrowUp")
  await key("Enter")
  expect(selections).toEqual([{ label: "Duplicate", id: 1 }])
})
