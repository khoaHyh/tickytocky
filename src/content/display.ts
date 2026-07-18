import type { DisplayLessonStatus } from "../experience/display-lesson"

/** Human-readable teaching copy for one display-lesson state. */
export type DisplayStatusGuide = Readonly<{
  description: string
  label: string
}>

/** Teaching copy keyed by the stable display-lesson states. */
export const displayStatusGuides: Readonly<Record<DisplayLessonStatus, DisplayStatusGuide>> = {
  paused: {
    description: "Compare the hand positions: the minute hand always advances twelve times as far as the hour hand.",
    label: "Hands paused",
  },
  ready: {
    description: "The hands turn the movement's internal motion into a readable indication of elapsed time.",
    label: "Readable output",
  },
  running: {
    description: "Playback compresses watch time so the generic 12:1 hand relationship is easy to see.",
    label: "Hands advancing",
  },
}

/** Generic display relationships shown beside the controls. */
export const displayRatioFacts = [
  { label: "Minute", value: "1 turn / h" },
  { label: "Hour", value: "1 turn / 12 h" },
  { label: "Relation", value: "12 : 1" },
] as const
