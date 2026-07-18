import type { SystemLessonStatus } from "../experience/system-lesson"

/** Human-readable teaching copy for one integrated-system state. */
export type SystemStatusGuide = Readonly<{
  description: string
  label: string
}>

/** Teaching copy keyed by the stable Assembly lesson states. */
export const systemStatusGuides: Readonly<Record<SystemLessonStatus, SystemStatusGuide>> = {
  paused: {
    description: "The same elapsed time now fixes every visible mechanism at one comparable system pose.",
    label: "System paused",
  },
  running: {
    description:
      "Stored energy turns the train while the regulator meters release and the hands indicate elapsed time.",
    label: "Whole watch running",
  },
  unwound: {
    description: "Load the illustrative spring before tracing energy through the complete watch.",
    label: "System at rest",
  },
  wound: {
    description: "The system is loaded: power, regulation, and display are ready to move together.",
    label: "Energy loaded",
  },
}

/** The three jobs composed by the integrated Assembly lesson. */
export const systemRoleFacts = [
  { label: "Power", value: "releases" },
  { label: "Regulation", value: "meters" },
  { label: "Display", value: "indicates" },
] as const
