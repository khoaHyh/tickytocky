import { expect, test, vi } from "vitest"

import { createPowerLesson } from "./power-lesson"

test("synchronizes playback before advancing and detaches its renderer", () => {
  const lesson = createPowerLesson()
  const render = vi.fn<() => void>()
  const detach = lesson.attachRenderer(render)
  lesson.wind()
  const wound = lesson.read()

  lesson.togglePlayback()

  expect(lesson.getSnapshot().status).toBe("running")
  expect(lesson.tick(10)).toEqual(wound)
  expect(lesson.tick(0.1)).not.toEqual(wound)

  lesson.togglePlayback()
  const renderCount = render.mock.calls.length
  detach()
  lesson.step()

  expect(render).toHaveBeenCalledTimes(renderCount)
  expect(lesson.getSnapshot().status).toBe("paused")
})
