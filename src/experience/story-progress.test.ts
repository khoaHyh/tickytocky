import { describe, expect, test, vi } from "vitest"

import {
  createStoryProgress,
  describeAssembly,
  measureStoryProgress,
  reduceMotion,
  stageStoryProgress,
} from "./story-progress"

describe("story progress", () => {
  test("measures the sticky story from assembled to exploded", () => {
    expect(measureStoryProgress({ top: 0, height: 5000, viewportHeight: 1000 })).toBe(0)
    expect(measureStoryProgress({ top: -2000, height: 5000, viewportHeight: 1000 })).toBe(0.5)
    expect(measureStoryProgress({ top: -4000, height: 5000, viewportHeight: 1000 })).toBe(1)
  })

  test("clamps progress beyond either end", () => {
    expect(measureStoryProgress({ top: 200, height: 5000, viewportHeight: 1000 })).toBe(0)
    expect(measureStoryProgress({ top: -5000, height: 5000, viewportHeight: 1000 })).toBe(1)
  })

  test("uses discrete chapter poses for reduced motion", () => {
    expect(reduceMotion(0.11, 4)).toBe(0)
    expect(reduceMotion(0.14, 4)).toBe(0.25)
    expect(reduceMotion(0.88, 4)).toBe(1)
  })

  test("dwells at chapter poses before moving to the next assembly state", () => {
    expect(stageStoryProgress(0.25, 4)).toBe(0.25)
    expect(stageStoryProgress(0.27, 4)).toBe(0.25)
    expect(stageStoryProgress(0.375, 4)).toBeCloseTo(0.375)
    expect(stageStoryProgress(0.48, 4)).toBe(0.5)
  })

  test("invalidates the renderer when progress changes", () => {
    const render = vi.fn<() => void>()
    const progress = createStoryProgress()
    const detach = progress.attachRenderer(render)

    progress.write(0.5)
    progress.write(0.5)
    detach()
    progress.write(1)

    expect(render).toHaveBeenCalledTimes(2)
  })

  test("describes only the stable endpoint states as assembled or exploded", () => {
    expect(describeAssembly(0).kind).toBe("assembled")
    expect(describeAssembly(0.5).kind).toBe("separating")
    expect(describeAssembly(1).kind).toBe("exploded")
  })
})
