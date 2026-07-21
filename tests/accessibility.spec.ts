import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("meets the automated WCAG accessibility baseline", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByText("Loading movement…")).toBeHidden()

  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()

  expect(results.violations).toEqual([])
})

test("shows a visible focus indicator during keyboard navigation", async ({ browserName, page }) => {
  await page.goto("/")
  await expect(page.getByText("Loading movement…")).toBeHidden()

  await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab")

  const firstControl = page.getByRole("button", { name: "Reset" })
  await expect(firstControl).toBeFocused()
  expect(
    await firstControl.evaluate((element) => {
      const view = element.ownerDocument.defaultView
      if (!view) return undefined
      const style = view.getComputedStyle(element)
      return { color: style.outlineColor, style: style.outlineStyle, width: style.outlineWidth }
    }),
  ).toEqual({ color: "rgb(189, 78, 58)", style: "solid", width: "2px" })
})
