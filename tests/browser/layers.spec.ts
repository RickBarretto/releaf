import { expect, test } from "@playwright/test"

test("typed layer switching and fallback preserve the map", async ({
  page,
}) => {
  await page.goto("/?layers")
  const map = page.locator(".leaflet-container")
  await expect(map).toBeVisible()
  await map.evaluate((element) =>
    element.setAttribute("data-identity", "original"),
  )
  const first = page.getByRole("button", { name: "First basemap" })
  const second = page.getByRole("button", { name: "Second basemap" })
  await expect(first).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByLabel("Layer changes")).toHaveText("0")
  await second.click()
  await expect(second).toHaveAttribute("aria-pressed", "true")
  await expect(
    page.locator(".leaflet-tile-container img").first(),
  ).toHaveAttribute("src", /tiles\/two\//)
  await page.getByRole("button", { name: "Remove second layer" }).click()
  await expect(first).toHaveAttribute("aria-pressed", "true")
  await expect(
    page.locator(".leaflet-tile-container img").first(),
  ).toHaveAttribute("src", /tiles\/one\//)
  await page.getByRole("button", { name: "Remove all layers" }).click()
  await expect(first).toHaveCount(0)
  await expect(page.locator(".leaflet-tile-container")).toHaveCount(0)
  await expect(page.getByLabel("Layer changes")).toHaveText("1")
  await expect(map).toHaveAttribute("data-identity", "original")
})
