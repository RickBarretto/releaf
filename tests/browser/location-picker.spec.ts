import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => {
    throw error
  })
  await page.route("**/*", (route) =>
    new URL(route.request().url()).hostname === "127.0.0.1"
      ? route.continue()
      : route.abort(),
  )
  await page.goto("/?picker")
  await expect(page.locator(".leaflet-marker-icon")).toBeVisible()
})

test("search, marker drag and map click share the selected coordinates", async ({
  page,
}) => {
  const coordinates = page.getByLabel("Latitude and longitude")
  await expect(coordinates).toHaveText("51.50740, -0.12780")
  const input = page.getByRole("combobox")
  await input.fill("Paris")
  await expect(page.getByRole("option")).toHaveCount(1)
  await input.press("ArrowDown")
  await input.press("Enter")
  await expect(coordinates).toHaveText("48.85840, 2.29450")
  await expect(input).toBeFocused()
  const marker = page.locator(".leaflet-marker-icon")
  const box = (await marker.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 80, box.y + 60, { steps: 12 })
  await page.mouse.up()
  await expect(coordinates).not.toHaveText("48.85840, 2.29450")
  await expect(page.getByLabel("Selected coordinates")).toContainText(
    "Marker drag",
  )
  await page
    .locator(".leaflet-container")
    .click({ position: { x: 450, y: 350 } })
  await expect(page.getByLabel("Selected coordinates")).toContainText(
    "Map click",
  )
  await input.fill("nowhere")
  await expect(page.getByText("No matching demo places")).toBeVisible()
})

test("location failure keeps the selection and can be retried", async ({
  page,
}) => {
  await page.evaluate(() => {
    let attempts = 0
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition(
          success: PositionCallback,
          failure: PositionErrorCallback,
        ) {
          attempts += 1
          if (attempts === 1)
            failure({
              message: "Permission denied",
            } as GeolocationPositionError)
          else
            success({
              coords: { latitude: -23.5614, longitude: -46.6559 },
            } as GeolocationPosition)
        },
      },
    })
  })
  await page.getByRole("button", { name: "Use current location" }).click()
  await expect(page.getByRole("alert")).toContainText("Permission denied")
  await expect(page.getByLabel("Latitude and longitude")).toHaveText(
    "51.50740, -0.12780",
  )
  await page.getByRole("button", { name: "Retry current location" }).click()
  await expect(page.getByLabel("Latitude and longitude")).toHaveText(
    "-23.56140, -46.65590",
  )
  await expect(page.getByRole("alert")).toHaveCount(0)
})

test("a newer selection wins over a pending geolocation request", async ({
  page,
}) => {
  await page.evaluate(() => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition(success: PositionCallback) {
          Object.assign(window, {
            finishLocation: () =>
              success({
                coords: { latitude: 0, longitude: 0 },
              } as GeolocationPosition),
          })
        },
      },
    })
  })
  await page.getByRole("button", { name: "Use current location" }).click()
  await expect(
    page.getByRole("button", { name: "Finding your location…" }),
  ).toBeDisabled()
  await page.getByRole("combobox").fill("Paris")
  await page.getByRole("option").click()
  await page.evaluate(() =>
    (window as unknown as { finishLocation: () => void }).finishLocation(),
  )
  await expect(page.getByLabel("Latitude and longitude")).toHaveText(
    "48.85840, 2.29450",
  )
})
