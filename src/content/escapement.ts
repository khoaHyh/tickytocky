import type { EscapementPhase } from "../experience/escapement-mechanics"

/** Human-readable teaching copy for one mechanism phase. */
export type EscapementPhaseGuide = Readonly<{
  description: string
  energy: "balance unlocks" | "free swing" | "train impulses" | "wheel drops"
  label: string
}>

/** Teaching copy keyed by the phase names returned by the escapement mechanics. */
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
