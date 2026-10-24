import { expect, test } from "@playwright/test"

test("navigation keeps its size through location pending, failure and retry", async ({
  page,
}) => {
  await page.route("**/*", (route) =>
    new URL(route.request().url()).hostname === "127.0.0.1"
      ? route.continue()
      : route.abort(),
  )
  await page.goto("/?navigation")
  const home = page.getByRole("button", { name: "Go home", exact: true })
  const toolbox = page.locator('[data-slot="map-panel"]').filter({ has: home })
  await expect(home).toBeVisible()
  const initial = (await toolbox.boundingBox())!
  expect(initial.width).toBeLessThanOrEqual(60)
  await expect(home).toHaveAttribute("data-size", "icon")
  // Tooltip composition must preserve the Button slot used by scoped styles.
  for (const name of ["Zoom in", "Zoom out", "Go home"]) {
    const button = toolbox.getByRole("button", { name, exact: true })
    await expect(button).toHaveAttribute("data-slot", "button")
    await expect(button).toHaveCSS("border-top-width", "0px")
    await expect(button).toHaveCSS("background-color", "rgba(0, 0, 0, 0)")
    await expect(button).toHaveCSS("width", "36px")
  }
  await page.evaluate(() => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition(
          success: PositionCallback,
          failure: PositionErrorCallback,
        ) {
          Object.assign(window, {
            failLocation: () =>
              failure({
                message: "Permission denied",
              } as GeolocationPositionError),
            finishLocation: () =>
              success({
                coords: { latitude: 1, longitude: 2 },
              } as GeolocationPosition),
          })
        },
      },
    })
  })
  await page.getByRole("button", { name: "Locate me", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Locate me", exact: true }),
  ).toBeDisabled()
  await expect(
    page.getByRole("status").filter({ hasText: "Finding your location" }),
  ).toBeVisible()
  expect(await toolbox.boundingBox()).toEqual(initial)
  await page.evaluate(() =>
    (window as unknown as { failLocation: () => void }).failLocation(),
  )
  await expect(page.getByRole("alert")).toContainText("Permission denied")
  expect(await toolbox.boundingBox()).toEqual(initial)
  await page.getByRole("button", { name: "Retry current location" }).click()
  await page.evaluate(() =>
    (window as unknown as { finishLocation: () => void }).finishLocation(),
  )
  await expect(page.getByRole("alert")).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "Locate me", exact: true }),
  ).toBeEnabled()
  expect(await toolbox.boundingBox()).toEqual(initial)
})
