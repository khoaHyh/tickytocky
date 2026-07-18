import { describe, expect, test } from "vitest"

import { samplePowerTrain } from "./power-mechanics"

describe("generic watch power train", () => {
  test("derives one watch minute from the illustrative train ratios", () => {
    const unwound = samplePowerTrain({ elapsedSeconds: 60, wind: 0 })
    const running = samplePowerTrain({ elapsedSeconds: 60, wind: 1 })

    expect(unwound.pose).toMatchObject({
      barrelTurns: 0,
      centerTurns: 0,
      fourthTurns: 0,
      mainspringWind: 0,
      thirdTurns: 0,
    })
    expect(running.pose.barrelTurns).toBeCloseTo(1 / 480)
    expect(running.pose.centerTurns).toBeCloseTo(-1 / 60)
    expect(running.pose.thirdTurns).toBeCloseTo(2 / 15)
    expect(running.pose.fourthTurns).toBeCloseTo(-1)
    expect(running.pose.mainspringWind).toBeCloseTo(479 / 480)
  })
})
