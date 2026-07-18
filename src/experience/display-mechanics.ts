/** The rotation of the readable hands after an elapsed period of watch time. */
export type DisplayPose = Readonly<{
  hourTurns: number
  minuteTurns: number
}>

/** A deterministic display pose independent of React, Three.js, and model geometry. */
export type DisplaySample = Readonly<{
  elapsedSeconds: number
  pose: DisplayPose
}>

/**
 * Samples the generic 12:1 relationship between the minute and hour hands.
 *
 * This models only the readable output. It does not claim to reproduce a
 * calibre's motion works, hand-setting mechanism, or production dimensions.
 */
export function sampleDisplay(elapsedSeconds: number): DisplaySample {
  if (!Number.isFinite(elapsedSeconds)) throw new RangeError("Display time must be finite.")

  const boundedSeconds = Math.max(elapsedSeconds, 0)
  return {
    elapsedSeconds: boundedSeconds,
    pose: {
      hourTurns: boundedSeconds / (12 * 60 * 60),
      minuteTurns: boundedSeconds / (60 * 60),
    },
  }
}
