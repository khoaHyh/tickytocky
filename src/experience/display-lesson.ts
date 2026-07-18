import { sampleDisplay, type DisplaySample } from "./display-mechanics"

/** Stable display states shown by the semantic controls. */
export type DisplayLessonStatus = "paused" | "ready" | "running"

/** Low-frequency state exposed to the semantic HTML controls. */
export type DisplayLessonSnapshot = Readonly<{
  displayedMinutes: number
  playing: boolean
  status: DisplayLessonStatus
}>

/** Mutable display-lesson coordinator shared by the controls and scene. */
export type DisplayLesson = Readonly<{
  /** Registers the scene invalidator used after a control changes the hands. */
  attachRenderer(invalidate: () => void): () => void
  /** Returns the stable control snapshot for `useSyncExternalStore`. */
  getSnapshot(): DisplayLessonSnapshot
  /** Returns the current hand pose without advancing playback. */
  read(): DisplaySample
  /** Resets both hand rotations to the lesson's authored starting pose. */
  reset(): void
  /** Advances ten minutes of watch time and pauses playback. */
  step(): void
  /** Subscribes to control and displayed-time changes, never per-frame poses. */
  subscribe(listener: () => void): () => void
  /** Advances playback by a render-frame delta and returns the new pose. */
  tick(deltaSeconds: number): DisplaySample
  /** Starts or pauses the compressed display playback. */
  togglePlayback(): void
}>

const watchSecondsPerRealSecond = 300

/** Creates one display-lesson coordinator; callers own its lifetime. */
export function createDisplayLesson(): DisplayLesson {
  let elapsedSeconds = 0
  let playing = false
  let renderer: (() => void) | undefined
  let synchronizeNextTick = false
  const listeners = new Set<() => void>()
  let snapshot = createSnapshot()

  function read() {
    return sampleDisplay(elapsedSeconds)
  }

  function createSnapshot(): DisplayLessonSnapshot {
    const displayedMinutes = Math.floor(read().elapsedSeconds / 60)
    return {
      displayedMinutes,
      playing,
      status: playing ? "running" : displayedMinutes > 0 ? "paused" : "ready",
    }
  }

  function publish() {
    const next = createSnapshot()
    if (
      next.displayedMinutes === snapshot.displayedMinutes &&
      next.playing === snapshot.playing &&
      next.status === snapshot.status
    ) {
      return
    }
    snapshot = next
    for (const listener of listeners) listener()
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
    reset() {
      elapsedSeconds = 0
      playing = false
      synchronizeNextTick = false
      render()
    },
    step() {
      elapsedSeconds += 10 * 60
      playing = false
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
          elapsedSeconds += Math.min(Math.max(deltaSeconds, 0), 0.1) * watchSecondsPerRealSecond
        }
        publish()
      }
      return read()
    },
    togglePlayback() {
      playing = !playing
      synchronizeNextTick = playing
      render()
    },
  }
}
