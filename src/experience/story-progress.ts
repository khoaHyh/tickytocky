/** The user-facing assembly state derived from story progress. */
export type AssemblyStatus =
  | { kind: "assembled"; label: "Watch assembled" }
  | { kind: "separating"; label: "Components separating" }
  | { kind: "exploded"; label: "Components exploded" }

/** A mutable progress value that owns render invalidation for the 3D scene. */
export type StoryProgress = ReturnType<typeof createStoryProgress>

/** Creates the single progress owner shared by the page and Three.js scene. */
export function createStoryProgress() {
  let value = 0
  let requestRender: (() => void) | undefined

  return {
    read() {
      return value
    },
    write(input: number) {
      const next = clamp(input)
      if (next === value) return value
      value = next
      requestRender?.()
      return value
    },
    attachRenderer(render: () => void) {
      requestRender = render
      render()
      return () => {
        if (requestRender !== render) return
        requestRender = undefined
      }
    },
  }
}

/** Calculates normalized progress through an element that contains a sticky viewport. */
export function measureStoryProgress(input: { top: number; height: number; viewportHeight: number }) {
  const travel = input.height - input.viewportHeight
  if (travel <= 0) return 0
  return clamp(-input.top / travel)
}

/** Converts continuous progress into discrete chapter poses when reduced motion is requested. */
export function reduceMotion(progress: number, intervals: number) {
  if (intervals <= 0) return clamp(progress)
  return Math.round(clamp(progress) * intervals) / intervals
}

/** Holds each chapter pose briefly and eases the transition to the next pose. */
export function stageStoryProgress(progress: number, intervals: number) {
  const value = clamp(progress)
  if (intervals <= 0 || value === 0 || value === 1) return value

  const scaled = value * intervals
  const chapter = Math.min(intervals - 1, Math.floor(scaled))
  const local = scaled - chapter
  if (local <= 0.18) return chapter / intervals
  if (local >= 0.82) return (chapter + 1) / intervals

  const transition = (local - 0.18) / 0.64
  const eased = transition * transition * (3 - 2 * transition)
  return (chapter + eased) / intervals
}

/** Returns the accessible state announced at the assembled and exploded endpoints. */
export function describeAssembly(progress: number): AssemblyStatus {
  if (progress <= 0.001) return { kind: "assembled", label: "Watch assembled" }
  if (progress >= 0.999) return { kind: "exploded", label: "Components exploded" }
  return { kind: "separating", label: "Components separating" }
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value))
}
