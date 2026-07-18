import { describe, expect, test } from "vitest"

import { createEscapementLesson } from "./escapement-lesson"
import { sampleEscapement } from "./escapement-mechanics"

describe("Swiss lever escapement cycle", () => {
  test("alternates locked free swings around two half-tooth releases", () => {
    const entryLock = sampleEscapement(0)
    const entryOutwardLimit = sampleEscapement(0.25)
    const exitLock = sampleEscapement(0.5)
    const exitOutwardLimit = sampleEscapement(0.75)
    const nextEntryLock = sampleEscapement(1)

    expect(entryLock).toMatchObject({
      phase: "entryLockedFreeOutward",
      pose: { balancePosition: 0, escapeWheelAdvance: 0, hairspringWind: 0, palletPosition: 1 },
    })
    expect(entryOutwardLimit.pose).toMatchObject({
      balancePosition: 1,
      escapeWheelAdvance: 0,
      hairspringWind: 1,
      palletPosition: 1,
    })
    expect(exitLock).toMatchObject({
      phase: "exitLockedFreeOutward",
      pose: { balancePosition: 0, escapeWheelAdvance: 0.5, hairspringWind: 0, palletPosition: -1 },
    })
    expect(exitOutwardLimit.pose).toMatchObject({
      balancePosition: -1,
      escapeWheelAdvance: 0.5,
      hairspringWind: -1,
      palletPosition: -1,
    })
    expect(nextEntryLock).toMatchObject({
      phase: "entryLockedFreeOutward",
      pose: { balancePosition: 0, escapeWheelAdvance: 1, hairspringWind: 0, palletPosition: 1 },
    })
  })

  test("wakes the demand-driven scene before advancing playback", () => {
    const lesson = createEscapementLesson()
    const paused = lesson.read()

    lesson.togglePlayback()

    expect(lesson.tick(10)).toEqual(paused)
    expect(lesson.tick(0.1)).not.toEqual(paused)
  })
})
