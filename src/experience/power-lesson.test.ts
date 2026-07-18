import { expect, test } from "vitest"

import { createPowerLesson } from "./power-lesson"

test("synchronizes playback before advancing and detaches its renderer", () => {
  const lesson = createPowerLesson()
  let renderCount = 0
  const render = () => {
    renderCount += 1
  }
  const detach = lesson.attachRenderer(render)
  lesson.wind()
  const wound = lesson.read()

  lesson.togglePlayback()

  expect(lesson.getSnapshot().status).toBe("running")
  expect(lesson.tick(10)).toEqual(wound)
  expect(lesson.tick(0.1)).not.toEqual(wound)

  lesson.togglePlayback()
  const countBeforeDetach = renderCount
  detach()
  lesson.step()

  expect(renderCount).toBe(countBeforeDetach)
  expect(lesson.getSnapshot().status).toBe("paused")
})
