import type { PowerLessonStatus } from "../experience/power-lesson"

/** Human-readable teaching copy for one power-lesson state. */
export type PowerStatusGuide = Readonly<{
  description: string
  label: string
}>

/** Teaching copy keyed by the stable power-lesson states. */
export const powerStatusGuides: Readonly<Record<PowerLessonStatus, PowerStatusGuide>> = {
  paused: {
    description: "The loaded train is paused so you can compare wheel positions.",
    label: "Train paused",
  },
  running: {
    description: "Every meshing pair reverses direction while downstream arbors turn faster.",
    label: "Train running",
  },
  unwound: {
    description: "Turn the arbor to tighten the mainspring before the train can run.",
    label: "Spring unwound",
  },
  wound: {
    description: "The arbor holds the inner spring while stored torque is ready to turn the barrel.",
    label: "Energy stored",
  },
}

/** The generic worked ratios displayed beside the power controls. */
export const powerRatioFacts = [
  { label: "Barrel", value: "1 turn / 8 h" },
  { label: "Center", value: "1 turn / h" },
  { label: "Fourth", value: "1 turn / min" },
] as const
