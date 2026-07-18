import { describe, expect, test } from "vitest"

import { sampleDisplay } from "./display-mechanics"

describe("generic watch display", () => {
  test("turns the minute hand twelve times for each hour-hand turn", () => {
    const display = sampleDisplay(10 * 60)

    expect(display.pose.minuteTurns).toBeCloseTo(1 / 6)
    expect(display.pose.hourTurns).toBeCloseTo(1 / 72)
    expect(display.pose.minuteTurns / display.pose.hourTurns).toBeCloseTo(12)
  })

  test("rejects a non-finite elapsed time", () => {
    expect(() => sampleDisplay(Number.POSITIVE_INFINITY)).toThrow("Display time must be finite.")
  })
})
