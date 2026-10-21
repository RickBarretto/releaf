import { expect, type Page, test } from "@playwright/test"

async function view(page: Page) {
  return JSON.parse(await page.getByTestId("view").innerText()) as {
    center: [number, number]
    zoom: number
  }
}
test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => {
    throw error
  })
  page.on("console", (message) => {
    if (message.type() === "error") throw Error(message.text())
  })
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url())
    return url.hostname === "127.0.0.1" || url.protocol === "data:"
      ? route.continue()
      : route.abort()
  })
  await page.goto("/")
  await expect(page.locator(".leaflet-tile-loaded").first()).toBeVisible()
})

test("drag, zoom, marker dragging, popup interaction and tooltip hover", async ({
  page,
}) => {
  const map = page.locator(".leaflet-container")
  const box = (await map.boundingBox())!
  await page.mouse.move(box.x + 150, box.y + 100)
  await page.mouse.down()
  await page.mouse.move(box.x + 220, box.y + 130, { steps: 10 })
  await page.mouse.up()
  await expect.poll(async () => (await view(page)).center).not.toEqual([0, 0])
  const initialZoom = (await view(page)).zoom
  await page.getByRole("button", { name: "Zoom in", exact: true }).click()
  await expect.poll(async () => (await view(page)).zoom).toBe(initialZoom + 1)
  await page.mouse.move(box.x + 500, box.y + 150)
  await page.mouse.wheel(0, -200)
  await expect
    .poll(async () => (await view(page)).zoom)
    .toBeGreaterThan(initialZoom + 1)
  await page.getByRole("button", { name: "Fly home" }).click()
  await expect.poll(async () => (await view(page)).zoom).toBe(6)
  // Return marker to the viewport using zoom-out before interacting.
  await page.getByRole("button", { name: "Zoom out", exact: true }).click()
  const marker = page.locator(".leaflet-marker-icon")
  await marker.hover()
  await expect(page.getByText("Marker tooltip", { exact: true })).toBeVisible()
  await marker.click()
  await page.getByRole("button", { name: "Popup count 0" }).click()
  await expect(
    page.getByRole("button", { name: "Popup count 1" }),
  ).toBeVisible()
  await page.locator(".leaflet-popup-close-button").click()
  const m = (await marker.boundingBox())!
  await page.mouse.move(m.x + m.width / 2, m.y + m.height / 2)
  await page.mouse.down()
  await page.mouse.move(m.x + 60, m.y + 30, { steps: 10 })
  await page.mouse.up()
  await expect(page.getByTestId("drag")).not.toBeEmpty()
})

test("toolbar isolates events, search retains focus and map remounts", async ({
  page,
}) => {
  const input = page.getByRole("combobox")
  const before = await view(page)
  await input.fill("Paris")
  await expect(page.getByRole("option")).toHaveCount(2)
  await expect(input).toHaveAttribute("aria-expanded", "true")
  await input.press("ArrowDown")
  await input.press("Enter")
  await expect(page.getByTestId("selected")).toHaveText("Paris City")
  await expect(input).toBeFocused()
  await expect(input).toHaveAttribute("aria-expanded", "false")
  await input.hover()
  await page.mouse.wheel(0, -500)
  await expect.poll(async () => view(page)).toEqual(before)
  await expect(page.getByTestId("click")).toHaveText("null")
  await page.getByRole("button", { name: "Toggle map" }).click()
  await expect(page.locator(".leaflet-container")).toHaveCount(0)
  await page.getByRole("button", { name: "Toggle map" }).click()
  await expect(page.locator(".leaflet-container")).toHaveCount(1)
  await expect(page.getByTestId("view")).toContainText('"zoom":5')
})

test("rotation keeps marker click coordinates aligned after camera and size changes", async ({
  page,
}) => {
  const pane = page.locator(".leaflet-map-pane")
  await page.getByRole("button", { name: "Rotate", exact: true }).click()
  await expect(pane).toHaveCSS("rotate", "45deg")
  await page.getByRole("button", { name: "Fly home" }).click()
  await expect.poll(async () => (await view(page)).zoom).toBe(6)
  await page.getByRole("button", { name: "Resize map" }).click()
  await expect(page.locator(".leaflet-container")).toHaveJSProperty(
    "clientWidth",
    900,
  )
  const marker = page.locator(".leaflet-marker-icon")
  // Click the marker's geographic anchor, just below its non-bubbling icon.
  const box = (await marker.boundingBox())!
  await page.mouse.click(box.x + box.width / 2, box.y + box.height + 5)
  await expect
    .poll(async () => page.getByTestId("click").innerText())
    .not.toBe("null")
  const position = JSON.parse(await page.getByTestId("click").innerText())
  expect(Math.abs(position.latitude)).toBeLessThan(1)
  expect(Math.abs(position.longitude)).toBeLessThan(1)
  await page.getByRole("button", { name: "Reset north" }).click()
  await expect(pane).toHaveCSS("rotate", "0deg")
  await page.getByRole("button", { name: "Toggle rotation" }).click()
  await page.getByRole("button", { name: "Rotate", exact: true }).click()
  await expect(pane).toHaveCSS("rotate", "0deg")
})

for (const turns of [1, 2, 5]) {
  test(`navigation follows screen axes at ${turns * 45} degrees`, async ({
    page,
  }) => {
    const map = page.locator(".leaflet-container")
    const marker = page.locator(".leaflet-marker-icon")
    for (let i = 0; i < turns; i++) {
      await page.getByRole("button", { name: "Rotate", exact: true }).click()
    }
    const before = (await marker.boundingBox())!
    const box = (await map.boundingBox())!
    await page.mouse.move(box.x + 150, box.y + 100)
    await page.mouse.down()
    await page.mouse.move(box.x + 230, box.y + 130, { steps: 10 })
    const dragged = (await marker.boundingBox())!
    expect(dragged.x - before.x).toBeCloseTo(80, -1)
    expect(dragged.y - before.y).toBeCloseTo(30, -1)
    // End without momentum so the keyboard displacement can be measured alone.
    await page.waitForTimeout(100)
    await page.mouse.up()
    await map.focus()
    await page.keyboard.press("ArrowRight")
    await expect
      .poll(async () => (await marker.boundingBox())!.x)
      .toBeCloseTo(dragged.x - 80, -1)
    const right = (await marker.boundingBox())!
    expect(right.y).toBeCloseTo(dragged.y, -1)
    await page.keyboard.press("ArrowDown")
    await expect
      .poll(async () => (await marker.boundingBox())!.y)
      .toBeCloseTo(right.y - 80, -1)
    expect((await marker.boundingBox())!.x).toBeCloseTo(right.x, -1)
  })
}

test("server markup hydrates and becomes interactive without errors", async ({
  page,
}) => {
  const response = await page.goto("/hydrate")
  expect(await response!.text()).toContain("Loading map")
  await expect(page.locator(".leaflet-container")).toBeVisible()
  await page.getByRole("button", { name: "Zoom in", exact: true }).click()
  await expect.poll(async () => (await view(page)).zoom).toBe(6)
})
