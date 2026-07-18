import { describe, expect, test, vi } from "vitest"

import { createDisplayLesson } from "./display-lesson"

describe("display lesson coordinator", () => {
  test("steps both hands by ten minutes and wakes the renderer", () => {
    const lesson = createDisplayLesson()
    const invalidate = vi.fn<() => void>()
    lesson.attachRenderer(invalidate)

    lesson.step()

    expect(lesson.getSnapshot()).toMatchObject({ displayedMinutes: 10, playing: false })
    expect(lesson.read().pose).toMatchObject({
      hourTurns: 1 / 72,
      minuteTurns: 1 / 6,
    })
    expect(invalidate).toHaveBeenCalledOnce()
  })

  test("resets the elapsed display time", () => {
    const lesson = createDisplayLesson()
    lesson.step()

    lesson.reset()

    expect(lesson.getSnapshot()).toMatchObject({ displayedMinutes: 0, playing: false })
    expect(lesson.read().elapsedSeconds).toBe(0)
  })
})
