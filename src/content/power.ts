import type { PowerLessonStatus } from "../experience/power-lesson"
import powerTrain from "./power-train.json"

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
    description: "Each visible mesh reverses direction while downstream arbors turn faster.",
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
const reserveHours = powerTrain.reserveSecondsAtFullWind / (60 * 60)
const centerHoursPerTurn = reserveHours / ratio(powerTrain.meshes.barrelToCenter)
const fourthMinutesPerTurn =
  (centerHoursPerTurn * 60) / ratio(powerTrain.meshes.centerToThird) / ratio(powerTrain.meshes.thirdToFourth)

export const powerRatioFacts = [
  { label: "Barrel", value: `1 turn / ${formatPeriod(reserveHours, "h")}` },
  { label: "Center", value: `1 turn / ${formatPeriod(centerHoursPerTurn, "h")}` },
  { label: "Fourth", value: `1 turn / ${formatPeriod(fourthMinutesPerTurn, "min")}` },
] as const

function ratio(mesh: { pinionLeaves: number; wheelTeeth: number }) {
  return mesh.wheelTeeth / mesh.pinionLeaves
}

function formatPeriod(value: number, unit: string) {
  return value === 1 ? unit : `${value} ${unit}`
}
