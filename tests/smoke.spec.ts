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

  const controls = page.getByTestId("escapement-controls")
  await expect(controls.getByRole("button", { name: "Play cycle" })).toBeDisabled()
  await expect(controls.locator("output strong")).toHaveText("Entry lock")

  await controls.getByRole("button", { name: "Next" }).focus()
  await page.keyboard.press("Enter")

  await expect(controls.locator("output strong")).toHaveText("Entry unlock")
  await expect(controls.locator("output")).toContainText("Phase 2 of 8")
})
