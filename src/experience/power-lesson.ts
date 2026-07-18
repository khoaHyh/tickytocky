import { samplePowerTrain, type PowerTrainSample } from "./power-mechanics"

/** Deliberately compressed rates measured in watch seconds per real second. */
export type PowerPlaybackRate = "normal" | "slow"

/** Stable lesson states shown by the semantic controls. */
export type PowerLessonStatus = "paused" | "running" | "unwound" | "wound"

/** Low-frequency state exposed to the semantic HTML controls. */
export type PowerLessonSnapshot = Readonly<{
  displayedSeconds: number
  playing: boolean
  rate: PowerPlaybackRate
  status: PowerLessonStatus
  wound: boolean
}>

/** Mutable power-lesson coordinator shared by the controls and scene. */
export type PowerLesson = Readonly<{
  /** Registers the scene invalidator used after a control changes the train. */
  attachRenderer(invalidate: () => void): () => void
  /** Returns the stable control snapshot for `useSyncExternalStore`. */
  getSnapshot(): PowerLessonSnapshot
  /** Returns the current ratio-derived pose without advancing playback. */
  read(): PowerTrainSample
  /** Selects one of the compressed educational playback rates. */
  setRate(rate: PowerPlaybackRate): void
  /** Advances ten seconds of watch time and pauses playback. */
  step(): void
  /** Subscribes to control and displayed-time changes, never per-frame poses. */
  subscribe(listener: () => void): () => void
  /** Advances playback by a render-frame delta and returns the new pose. */
  tick(deltaSeconds: number): PowerTrainSample
  /** Starts or pauses the loaded train without resetting elapsed watch time. */
  togglePlayback(): void
  /** Fully winds the illustrative spring and resets watch time. */
  wind(): void
}>

const watchSecondsPerRealSecond: Readonly<Record<PowerPlaybackRate, number>> = {
  normal: 20,
  slow: 5,
}

/** Creates one power-lesson coordinator; callers own its lifetime. */
export function createPowerLesson(): PowerLesson {
  let elapsedSeconds = 0
  let initialWind = 0
  let playing = false
  let rate: PowerPlaybackRate = "slow"
  let renderer: (() => void) | undefined
  let synchronizeNextTick = false
  const listeners = new Set<() => void>()
  let snapshot = createSnapshot()

  function read() {
    return samplePowerTrain({ elapsedSeconds, wind: initialWind })
  }

  function createSnapshot(): PowerLessonSnapshot {
    const sample = read()
    const wound = sample.pose.mainspringWind > 0
    const status: PowerLessonStatus = !wound
      ? "unwound"
      : playing
        ? "running"
        : sample.elapsedSeconds > 0
          ? "paused"
          : "wound"
    return {
      displayedSeconds: Math.floor(sample.elapsedSeconds / 10) * 10,
      playing,
      rate,
      status,
      wound,
    }
  }

  function publish() {
    const next = createSnapshot()
    if (
      next.displayedSeconds === snapshot.displayedSeconds &&
      next.playing === snapshot.playing &&
      next.rate === snapshot.rate &&
      next.status === snapshot.status &&
      next.wound === snapshot.wound
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
    setRate(nextRate) {
      rate = nextRate
      render()
    },
    step() {
      if (initialWind <= 0) return
      playing = false
      synchronizeNextTick = false
      elapsedSeconds += 10
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
          elapsedSeconds += Math.min(Math.max(deltaSeconds, 0), 0.1) * watchSecondsPerRealSecond[rate]
        }

        const sample = read()
        if (sample.pose.mainspringWind <= 0) playing = false
        publish()
        return sample
      }
      return read()
    },
    togglePlayback() {
      if (initialWind <= 0) return
      playing = !playing
      synchronizeNextTick = playing
      render()
    },
    wind() {
      elapsedSeconds = 0
      initialWind = 1
      playing = false
      synchronizeNextTick = false
      render()
    },
  }
}
