/** A mechanically meaningful interval within one generic Swiss lever cycle. */
export type EscapementPhase =
  | "entryLockedFreeOutward"
  | "entryUnlock"
  | "entryImpulse"
  | "dropToExit"
  | "exitLockedFreeOutward"
  | "exitUnlock"
  | "exitImpulse"
  | "dropToEntry"

/** Normalized mechanism positions, independent of Three.js and model dimensions. */
export type EscapementPose = Readonly<{
  balancePosition: number
  escapeWheelAdvance: number
  hairspringWind: number
  palletPosition: number
}>

/** The named phase and deterministic pose at one point in the ongoing cycle. */
export type EscapementSample = Readonly<{
  phase: EscapementPhase
  pose: EscapementPose
}>

/** Human-readable teaching copy for one mechanism phase. */
export type EscapementPhaseGuide = Readonly<{
  description: string
  energy: "balance unlocks" | "free swing" | "train impulses" | "wheel drops"
  label: string
}>

/** One useful pause point for manual phase-by-phase exploration. */
export type EscapementPhaseStop = Readonly<{
  cycleOffset: number
  phase: EscapementPhase
}>

/** Teaching copy keyed by the same phase names returned by `sampleEscapement`. */
export const escapementPhaseGuides: Readonly<Record<EscapementPhase, EscapementPhaseGuide>> = {
  entryLockedFreeOutward: {
    description: "The entry pallet holds the wheel while the balance swings freely.",
    energy: "free swing",
    label: "Entry lock",
  },
  entryUnlock: {
    description: "The returning balance spends a little stored energy to unlock the entry pallet.",
    energy: "balance unlocks",
    label: "Entry unlock",
  },
  entryImpulse: {
    description: "The released train turns the wheel and fork, giving the balance a short push.",
    energy: "train impulses",
    label: "Entry impulse",
  },
  dropToExit: {
    description: "The wheel crosses a small clearance before the next tooth reaches the exit pallet.",
    energy: "wheel drops",
    label: "Drop to exit",
  },
  exitLockedFreeOutward: {
    description: "The exit pallet now holds the wheel while the balance swings the other way.",
    energy: "free swing",
    label: "Exit lock",
  },
  exitUnlock: {
    description: "The returning balance spends a little stored energy to unlock the exit pallet.",
    energy: "balance unlocks",
    label: "Exit unlock",
  },
  exitImpulse: {
    description: "The train gives the balance its second short push through the wheel and fork.",
    energy: "train impulses",
    label: "Exit impulse",
  },
  dropToEntry: {
    description: "The next tooth reaches the entry pallet, locking the wheel for another free swing.",
    energy: "wheel drops",
    label: "Drop to entry",
  },
}

/** Representative points used by Previous and Next controls; values are not caliber dimensions. */
export const escapementPhaseStops: readonly EscapementPhaseStop[] = [
  { cycleOffset: 0.25, phase: "entryLockedFreeOutward" },
  { cycleOffset: 0.45, phase: "entryUnlock" },
  { cycleOffset: 0.475, phase: "entryImpulse" },
  { cycleOffset: 0.495, phase: "dropToExit" },
  { cycleOffset: 0.75, phase: "exitLockedFreeOutward" },
  { cycleOffset: 0.95, phase: "exitUnlock" },
  { cycleOffset: 0.975, phase: "exitImpulse" },
  { cycleOffset: 0.995, phase: "dropToEntry" },
]

/**
 * Samples an ongoing generic Swiss lever cycle.
 *
 * One whole number advances the balance by one oscillation and the escape wheel
 * by one illustrative tooth pitch. The result intentionally models educational
 * poses rather than caliber-specific dynamics.
 *
 * @throws {RangeError} When `cycle` is not finite, which indicates a caller defect.
 */
export function sampleEscapement(cycle: number): EscapementSample {
  if (!Number.isFinite(cycle)) throw new RangeError("Escapement cycle must be finite.")

  const completedCycles = Math.floor(cycle)
  const progress = cycle - completedCycles
  const balancePosition = cleanUnit(Math.sin(progress * Math.PI * 2))

  return {
    phase: phaseAt(progress),
    pose: {
      balancePosition,
      escapeWheelAdvance: completedCycles + wheelAdvanceAt(progress),
      hairspringWind: balancePosition,
      palletPosition: palletPositionAt(progress),
    },
  }
}

function phaseAt(progress: number): EscapementPhase {
  if (progress < 0.44) return "entryLockedFreeOutward"
  if (progress < 0.46) return "entryUnlock"
  if (progress < 0.49) return "entryImpulse"
  if (progress < 0.5) return "dropToExit"
  if (progress < 0.94) return "exitLockedFreeOutward"
  if (progress < 0.96) return "exitUnlock"
  if (progress < 0.99) return "exitImpulse"
  return "dropToEntry"
}

function wheelAdvanceAt(progress: number) {
  if (progress < 0.46) return 0
  if (progress < 0.5) return smoothstep((progress - 0.46) / 0.04) * 0.5
  if (progress < 0.96) return 0.5
  return 0.5 + smoothstep((progress - 0.96) / 0.04) * 0.5
}

function palletPositionAt(progress: number) {
  if (progress < 0.44) return 1
  if (progress < 0.49) return 1 - smoothstep((progress - 0.44) / 0.05) * 2
  if (progress < 0.94) return -1
  if (progress < 0.99) return -1 + smoothstep((progress - 0.94) / 0.05) * 2
  return 1
}

function smoothstep(progress: number) {
  const clamped = Math.min(1, Math.max(0, progress))
  return clamped * clamped * (3 - 2 * clamped)
}

function cleanUnit(value: number) {
  if (Math.abs(value) < 1e-12) return 0
  if (Math.abs(value - 1) < 1e-12) return 1
  if (Math.abs(value + 1) < 1e-12) return -1
  return value
}
