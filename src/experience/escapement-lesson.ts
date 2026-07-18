import {
  escapementPhaseStops,
  sampleEscapement,
  type EscapementPhase,
  type EscapementSample,
} from "./escapement-mechanics"

/** The deliberately slowed playback rates offered by the educational controls. */
export type EscapementPlaybackRate = "normal" | "slow"

/** Low-frequency state exposed to semantic HTML controls. */
export type EscapementLessonSnapshot = Readonly<{
  phase: EscapementPhase
  playing: boolean
  rate: EscapementPlaybackRate
}>

/** Mutable lesson coordinator shared by HTML controls and the demand-driven scene. */
export type EscapementLesson = Readonly<{
  /** Registers the scene invalidator used after a control changes the mechanism. */
  attachRenderer(invalidate: () => void): () => void
  /** Returns the current stable control snapshot for `useSyncExternalStore`. */
  getSnapshot(): EscapementLessonSnapshot
  /** Returns the current mechanism pose without advancing playback. */
  read(): EscapementSample
  /** Selects one of the deliberately slowed educational playback rates. */
  setRate(rate: EscapementPlaybackRate): void
  /** Moves to the adjacent named phase and pauses playback. */
  step(direction: -1 | 1): void
  /** Subscribes to phase and control changes, never per-frame pose changes. */
  subscribe(listener: () => void): () => void
  /** Advances playback by a render-frame delta and returns the new pose. */
  tick(deltaSeconds: number): EscapementSample
  /** Starts or pauses playback without resetting the current cycle. */
  togglePlayback(): void
}>

const cyclesPerSecond: Readonly<Record<EscapementPlaybackRate, number>> = {
  normal: 0.4,
  slow: 0.12,
}

/** Creates one lesson coordinator; callers own its lifetime. */
export function createEscapementLesson(): EscapementLesson {
  let cycle = escapementPhaseStops[0]?.cycleOffset ?? 0
  let playing = false
  let synchronizeNextTick = false
  let rate: EscapementPlaybackRate = "slow"
  let renderer: (() => void) | undefined
  const listeners = new Set<() => void>()
  let snapshot = createSnapshot()

  function createSnapshot(): EscapementLessonSnapshot {
    return { phase: sampleEscapement(cycle).phase, playing, rate }
  }

  function publish() {
    const next = createSnapshot()
    if (next.phase === snapshot.phase && next.playing === snapshot.playing && next.rate === snapshot.rate) return
    snapshot = next
    for (const listener of listeners) listener()
  }

  function setCycle(nextCycle: number) {
    cycle = nextCycle
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
    read() {
      return sampleEscapement(cycle)
    },
    setRate(nextRate) {
      rate = nextRate
      publish()
      renderer?.()
    },
    step(direction) {
      playing = false
      const current = sampleEscapement(cycle)
      const currentIndex = escapementPhaseStops.findIndex((stop) => stop.phase === current.phase)
      const baseCycle = Math.floor(cycle)
      const nextIndex = currentIndex + direction

      if (nextIndex < 0) {
        const previous = escapementPhaseStops.at(-1)
        if (previous) setCycle(baseCycle - 1 + previous.cycleOffset)
        return
      }

      if (nextIndex >= escapementPhaseStops.length) {
        const first = escapementPhaseStops[0]
        if (first) setCycle(baseCycle + 1 + first.cycleOffset)
        return
      }

      const next = escapementPhaseStops[nextIndex]
      if (next) setCycle(baseCycle + next.cycleOffset)
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
          cycle += Math.min(Math.max(deltaSeconds, 0), 0.1) * cyclesPerSecond[rate]
        }
        publish()
      }
      return sampleEscapement(cycle)
    },
    togglePlayback() {
      playing = !playing
      synchronizeNextTick = playing
      publish()
      renderer?.()
    },
  }
}
