import { expect, test } from "@playwright/test"

test("introduces the mechanical watch guide", async ({ page }) => {
  const consoleErrors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text())
  })

  await page.goto("/")

  await expect(page.getByRole("heading", { level: 1, name: "TickyTocky" })).toBeVisible()
  await expect(page.getByText("An interactive guide to mechanical watches.")).toBeVisible()
  expect(consoleErrors).toEqual([])
})
