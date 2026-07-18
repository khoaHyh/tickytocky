import type { DisplayLesson } from "./display-lesson"
import { sampleDisplay, type DisplaySample } from "./display-mechanics"
import type { EscapementLesson } from "./escapement-lesson"
import { escapementPhaseStops, sampleEscapement, type EscapementSample } from "./escapement-mechanics"
import type { PowerLesson } from "./power-lesson"
import { samplePowerTrain, type PowerTrainSample } from "./power-mechanics"

/** Stable integrated-system states shown by the Assembly controls. */
export type SystemLessonStatus = "paused" | "running" | "unwound" | "wound"

/** One synchronized sample of the display, power train, and regulator. */
export type SystemSample = Readonly<{
  display: DisplaySample
  power: PowerTrainSample
  regulation: EscapementSample
}>

/** Low-frequency state exposed to the semantic Assembly controls. */
export type SystemLessonSnapshot = Readonly<{
  displayedMinutes: number
  playing: boolean
  status: SystemLessonStatus
  wound: boolean
}>

/** Existing lesson coordinators that yield transform ownership to the integrated system. */
export type SystemLessonDependencies = Readonly<{
  displayLesson: DisplayLesson
  escapementLesson: EscapementLesson
  powerLesson: PowerLesson
}>

/** Coordinates one illustrative whole-watch run without owning Three.js transforms. */
export type SystemLesson = Readonly<{
  attachRenderer(invalidate: () => void): () => void
  getSnapshot(): SystemLessonSnapshot
  read(): SystemSample
  /** Advances ten minutes and one representative half-cycle, then pauses. */
  step(): void
  subscribe(listener: () => void): () => void
  tick(deltaSeconds: number): SystemSample
  togglePlayback(): void
  /** Loads the illustrative spring and resets every integrated mechanism pose. */
  wind(): void
}>

const initialRegulationCycle = escapementPhaseStops[0]?.cycleOffset ?? 0.25
const regulationCyclesPerRealSecond = 0.4
const watchSecondsPerRealSecond = 60

/** Creates one integrated-system coordinator; callers own its lifetime. */
export function createSystemLesson(dependencies: SystemLessonDependencies): SystemLesson {
  let elapsedSeconds = 0
  let initialWind = 0
  let playing = false
  let regulationCycle = initialRegulationCycle
  let renderer: (() => void) | undefined
  let synchronizeNextTick = false
  const listeners = new Set<() => void>()
  let snapshot = createSnapshot()

  function read(): SystemSample {
    const power = samplePowerTrain({ elapsedSeconds, wind: initialWind })
    return {
      display: sampleDisplay(power.elapsedSeconds),
      power,
      regulation: sampleEscapement(regulationCycle),
    }
  }

  function createSnapshot(): SystemLessonSnapshot {
    const sample = read()
    const wound = sample.power.pose.mainspringWind > 0
    return {
      displayedMinutes: Math.floor(sample.power.elapsedSeconds / 60),
      playing,
      status: !wound ? "unwound" : playing ? "running" : sample.power.elapsedSeconds > 0 ? "paused" : "wound",
      wound,
    }
  }

  function publish() {
    const next = createSnapshot()
    if (
      next.displayedMinutes === snapshot.displayedMinutes &&
      next.playing === snapshot.playing &&
      next.status === snapshot.status &&
      next.wound === snapshot.wound
    ) {
      return
    }
    snapshot = next
    for (const listener of listeners) listener()
  }

  function quiesceIndependentLessons() {
    if (dependencies.displayLesson.getSnapshot().playing) dependencies.displayLesson.togglePlayback()
    if (dependencies.escapementLesson.getSnapshot().playing) dependencies.escapementLesson.togglePlayback()
    if (dependencies.powerLesson.getSnapshot().playing) dependencies.powerLesson.togglePlayback()
  }

  function render() {
    publish()
    renderer?.()
  }

  return {
    attachRenderer(invalidate) {
      renderer = invalidate
      return () => {
        if (renderer === invalidate) renderer = undefined
      }
    },
    getSnapshot() {
      return snapshot
    },
    read,
    step() {
      if (read().power.pose.mainspringWind <= 0) return
      quiesceIndependentLessons()
      elapsedSeconds += 10 * 60
      playing = false
      regulationCycle += 0.5
      synchronizeNextTick = false
      render()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    tick(deltaSeconds) {
      if (playing) {
        if (synchronizeNextTick) {
          synchronizeNextTick = false
        } else {
          const frameSeconds = Math.min(Math.max(deltaSeconds, 0), 0.1)
          elapsedSeconds += frameSeconds * watchSecondsPerRealSecond
          regulationCycle += frameSeconds * regulationCyclesPerRealSecond
        }
        if (read().power.pose.mainspringWind <= 0) playing = false
        publish()
      }
      return read()
    },
    togglePlayback() {
      if (read().power.pose.mainspringWind <= 0) return
      if (!playing) quiesceIndependentLessons()
      playing = !playing
      synchronizeNextTick = playing
      render()
    },
    wind() {
      quiesceIndependentLessons()
      elapsedSeconds = 0
      initialWind = 1
      playing = false
      regulationCycle = initialRegulationCycle
      synchronizeNextTick = false
      render()
    },
  }
}
