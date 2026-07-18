import { expect, test } from "@playwright/test"

test("introduces the mechanical watch guide", async ({ page }) => {
  const consoleErrors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text())
  })

  const modelResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/models/watch-model.glb",
  )
  await page.goto("/")

  expect((await modelResponse).ok()).toBe(true)
  await expect(page.getByText("Loading movement…")).toBeHidden()
  await expect(page.getByRole("heading", { level: 1, name: "TickyTocky" })).toBeVisible()
  await expect(page.getByText("An interactive guide to mechanical watches.")).toBeVisible()
  await expect(page.getByTestId("watch-scene")).toBeVisible()
  expect(consoleErrors).toEqual([])
})

test("scrolling explodes and rebuilds the watch", async ({ page }) => {
  await page.goto("/")

  const status = page.getByTestId("assembly-status")
  await expect(status).toHaveText("Watch assembled")
  await expect(status).toHaveAttribute("data-progress", "0.000")

  await page.evaluate("window.scrollTo(0, document.documentElement.scrollHeight)")
  await expect(status).toHaveText("Components exploded")
  await expect(status).toHaveAttribute("data-progress", "1.000")
  expect(await page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")).toBe(false)

  await page.evaluate("window.scrollTo(0, 0)")
  await expect(status).toHaveText("Watch assembled")
  await expect(status).toHaveAttribute("data-progress", "0.000")
})

test("reduced motion uses discrete chapter poses", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")

  await page.evaluate("window.scrollTo(0, document.documentElement.scrollHeight * 0.36)")
  await expect(page.getByTestId("assembly-status")).toHaveAttribute("data-progress", "0.500")
})

test("reduced motion keeps manual escapement stepping available", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")

  const displayControls = page.getByTestId("display-controls")
  await expect(displayControls.getByRole("button", { name: "Play hands" })).toBeDisabled()
  await displayControls.getByRole("button", { name: "+10 min" }).click()
  await expect(displayControls.locator("output strong")).toHaveText("Hands paused")
  await expect(displayControls).toContainText("Elapsed display time 10 min")

  const controls = page.getByTestId("escapement-controls")
  await expect(controls.getByRole("button", { name: "Play cycle" })).toBeDisabled()
  await expect(controls.locator("output strong")).toHaveText("Entry lock")

  await controls.getByRole("button", { name: "Next" }).focus()
  await page.keyboard.press("Enter")

  await expect(controls.locator("output strong")).toHaveText("Entry unlock")
  await expect(controls.locator("output")).toContainText("Phase 2 of 8")

  const powerControls = page.getByTestId("power-controls")
  await expect(powerControls.getByRole("button", { name: "Run train" })).toBeDisabled()
  await powerControls.getByRole("button", { name: "Wind spring" }).click()
  await expect(powerControls.locator("output strong")).toHaveText("Energy stored")

  await powerControls.getByRole("button", { name: "+10 sec" }).focus()
  await page.keyboard.press("Enter")

  await expect(powerControls.locator("output strong")).toHaveText("Train paused")
  await expect(powerControls).toContainText("Watch time 0:10")
})

test("the display hands advance and pause", async ({ page }) => {
  await page.goto("/")

  const controls = page.getByTestId("display-controls")
  const elapsedTime = controls.getByText(/^Elapsed display time /)
  await controls.getByRole("button", { name: "Play hands" }).click()

  await expect(controls.locator("output strong")).toHaveText("Hands advancing")
  await expect(elapsedTime).not.toHaveText("Elapsed display time 0 min")
  await controls.getByRole("button", { name: "Pause hands" }).click()

  const pausedTime = await elapsedTime.evaluate((element) => element.textContent ?? "")
  await page.waitForTimeout(750)
  await expect(elapsedTime).toHaveText(pausedTime)
  await expect(controls.locator("output strong")).toHaveText("Hands paused")
})

test("the wound power train runs and pauses", async ({ page }) => {
  await page.goto("/")

  const powerControls = page.getByTestId("power-controls")
  const watchTime = powerControls.getByText(/^Watch time /)
  await powerControls.getByRole("button", { name: "Wind spring" }).click()
  await powerControls.getByRole("combobox", { name: "Study speed" }).selectOption("normal")
  await powerControls.getByRole("button", { name: "Run train" }).click()

  await expect(powerControls.locator("output strong")).toHaveText("Train running")
  await expect(watchTime).not.toHaveText("Watch time 0:00")
  await powerControls.getByRole("button", { name: "Pause train" }).click()

  const pausedTime = await watchTime.evaluate((element) => element.textContent ?? "")
  await page.waitForTimeout(750)
  await expect(watchTime).toHaveText(pausedTime)
  await expect(powerControls.locator("output strong")).toHaveText("Train paused")
})
