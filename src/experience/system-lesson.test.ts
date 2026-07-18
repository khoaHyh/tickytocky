import { describe, expect, test, vi } from "vitest"

import { createDisplayLesson } from "./display-lesson"
import { createEscapementLesson } from "./escapement-lesson"
import { createPowerLesson } from "./power-lesson"
import { createSystemLesson } from "./system-lesson"

describe("integrated watch-system coordinator", () => {
  test("advances the powered train and display from one elapsed-time source", () => {
    const lesson = createSystemLesson({
      displayLesson: createDisplayLesson(),
      escapementLesson: createEscapementLesson(),
      powerLesson: createPowerLesson(),
    })
    const invalidate = vi.fn<() => void>()
    lesson.attachRenderer(invalidate)

    lesson.wind()
    lesson.step()

    const sample = lesson.read()
    expect(sample.power.elapsedSeconds).toBe(10 * 60)
    expect(sample.display.elapsedSeconds).toBe(sample.power.elapsedSeconds)
    expect(sample.display.pose.minuteTurns).toBeCloseTo(1 / 6)
    expect(sample.power.pose.fourthTurns).toBeCloseTo(-10)
    expect(lesson.getSnapshot()).toMatchObject({ displayedMinutes: 10, playing: false, status: "paused" })
    expect(invalidate).toHaveBeenCalledTimes(2)
  })

  test("pauses independently running lessons when the system is engaged", () => {
    const displayLesson = createDisplayLesson()
    const escapementLesson = createEscapementLesson()
    const powerLesson = createPowerLesson()
    displayLesson.togglePlayback()
    escapementLesson.togglePlayback()
    powerLesson.wind()
    powerLesson.togglePlayback()
    const lesson = createSystemLesson({ displayLesson, escapementLesson, powerLesson })

    lesson.wind()

    expect(displayLesson.getSnapshot().playing).toBe(false)
    expect(escapementLesson.getSnapshot().playing).toBe(false)
    expect(powerLesson.getSnapshot().playing).toBe(false)
  })

  test("stops the display when the illustrative spring is exhausted", () => {
    const lesson = createSystemLesson({
      displayLesson: createDisplayLesson(),
      escapementLesson: createEscapementLesson(),
      powerLesson: createPowerLesson(),
    })
    lesson.wind()

    for (let step = 0; step < 48; step += 1) lesson.step()
    const exhausted = lesson.read()
    lesson.step()

    expect(lesson.getSnapshot()).toMatchObject({ displayedMinutes: 480, playing: false, status: "unwound" })
    expect(exhausted.display.elapsedSeconds).toBe(exhausted.power.elapsedSeconds)
    expect(lesson.read()).toEqual(exhausted)
  })
})
