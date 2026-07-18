import { powerTrain, powerTrainRatio } from "../content/power-train-contract"

const barrelToCenterRatio = powerTrainRatio(powerTrain.meshes.barrelToCenter)
const centerToThirdRatio = powerTrainRatio(powerTrain.meshes.centerToThird)
const thirdToFourthRatio = powerTrainRatio(powerTrain.meshes.thirdToFourth)

/** Inputs to the generic, ratio-derived power-train model. */
export type PowerTrainInput = Readonly<{
  elapsedSeconds: number
  wind: number
}>

/** Normalized mechanism positions, independent of Three.js and model dimensions. */
export type PowerTrainPose = Readonly<{
  barrelArborTurns: number
  barrelTurns: number
  centerTurns: number
  fourthTurns: number
  mainspringWind: number
  thirdTurns: number
}>

/** The bounded running time and deterministic pose of the illustrative train. */
export type PowerTrainSample = Readonly<{
  elapsedSeconds: number
  pose: PowerTrainPose
}>

/**
 * Samples the generic 8-hour worked ratio example used by the lesson.
 *
 * Time may be played faster for study, but the returned rotations preserve the
 * illustrative 8:1, 8:1, and 7.5:1 barrel-to-fourth relationships. The Power
 * lesson stops at the fourth wheel; the Regulation lesson owns the escape arbor.
 *
 * @throws {RangeError} When either numeric input is not finite.
 */
export function samplePowerTrain(input: PowerTrainInput): PowerTrainSample {
  if (!Number.isFinite(input.elapsedSeconds) || !Number.isFinite(input.wind)) {
    throw new RangeError("Power-train inputs must be finite.")
  }

  const initialWind = clamp(input.wind)
  const availableSeconds = initialWind * powerTrain.reserveSecondsAtFullWind
  const elapsedSeconds = Math.min(Math.max(input.elapsedSeconds, 0), availableSeconds)
  const barrelTurns = elapsedSeconds / powerTrain.reserveSecondsAtFullWind
  const centerTurns = barrelTurns === 0 ? 0 : -barrelTurns * barrelToCenterRatio
  const thirdTurns = centerTurns === 0 ? 0 : -centerTurns * centerToThirdRatio
  const fourthTurns = thirdTurns === 0 ? 0 : -thirdTurns * thirdToFourthRatio

  return {
    elapsedSeconds,
    pose: {
      barrelArborTurns: initialWind * powerTrain.arborTurnsAtFullWind,
      barrelTurns,
      centerTurns,
      fourthTurns,
      mainspringWind: Math.max(0, initialWind - barrelTurns),
      thirdTurns,
    },
  }
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value))
}
