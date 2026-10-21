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
  await page.getByRole("button", { name: "Go to location" }).click()
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

test("server markup hydrates and becomes interactive without errors", async ({
  page,
}) => {
  const response = await page.goto("/hydrate")
  expect(await response!.text()).toContain("Loading map")
  await expect(page.locator(".leaflet-container")).toBeVisible()
  await page.getByRole("button", { name: "Zoom in", exact: true }).click()
  await expect.poll(async () => (await view(page)).zoom).toBe(6)
})

test("internal shadcn controls load packaged styles and inherit theme tokens", async ({
  page,
}) => {
  const button = page.locator('[data-slot="button"]').first()
  await expect(button).toHaveCSS("height", "36px")
  await expect(button).toHaveAttribute("data-variant", "ghost")
  await expect(button).toHaveAttribute("data-size", "icon")
  await expect(button.locator("svg")).toBeVisible()
  await expect(button).toHaveCSS("background-color", "rgba(0, 0, 0, 0)")
  await page.evaluate(() => {
    document.documentElement.style.setProperty("--accent", "rgb(20, 100, 60)")
  })
  await button.hover()
  await expect(button).toHaveCSS("background-color", "rgb(20, 100, 60)")
})

test("attribution utilities override Leaflet and inherit theme tokens", async ({
  page,
}) => {
  const footer = page.locator('[data-slot="map-footer"]')
  await expect(footer).toHaveCSS("padding", "4px 8px")
  await expect(footer).toHaveCSS("margin", "8px")
  await expect(footer).toHaveCSS("border-radius", "8px")
  await expect(footer).toHaveCSS("background-color", "rgb(255, 255, 255)")
  const link = footer.getByRole("link", { name: "{Re}leaf" })
  await expect(link).toHaveCSS("display", "inline")
  await expect(link).toHaveCSS("font-size", "11px")
  await expect(link).toHaveCSS("color", "rgb(23, 23, 23)")
  await link.hover()
  await expect(link).toHaveCSS("text-decoration-line", "underline")
  await page.evaluate(() => {
    document.documentElement.style.setProperty(
      "--background",
      "rgb(240, 245, 250)",
    )
  })
  await expect(footer).toHaveCSS("background-color", "rgb(240, 245, 250)")
})
