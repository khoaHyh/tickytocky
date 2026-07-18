import { useEffect, useSyncExternalStore, type ChangeEvent } from "react"

import type { EscapementLesson, EscapementPlaybackRate } from "./escapement-lesson"
import { escapementPhaseGuides, escapementPhaseStops } from "./escapement-mechanics"

/** Renders accessible, low-frequency controls for exploring one escapement cycle. */
export function EscapementControls(props: { lesson: EscapementLesson; reducedMotion: boolean }) {
  const snapshot = useSyncExternalStore(props.lesson.subscribe, props.lesson.getSnapshot, props.lesson.getSnapshot)
  const guide = escapementPhaseGuides[snapshot.phase]
  const phaseIndex = escapementPhaseStops.findIndex((stop) => stop.phase === snapshot.phase)

  useEffect(() => {
    if (props.reducedMotion && snapshot.playing) props.lesson.togglePlayback()
  }, [props.lesson, props.reducedMotion, snapshot.playing])

  const changeRate = (event: ChangeEvent<HTMLSelectElement>) => {
    props.lesson.setRate(parsePlaybackRate(event.currentTarget.value))
  }

  return (
    <div className="escapement-controls" data-testid="escapement-controls">
      <div className="escapement-phase-heading">
        <span>
          Phase {phaseIndex + 1} / {escapementPhaseStops.length}
        </span>
        <span>{guide.energy}</span>
      </div>

      <output aria-atomic="true" aria-live={snapshot.playing ? "off" : "polite"} className="escapement-phase-output">
        <span className="sr-only">
          Phase {phaseIndex + 1} of {escapementPhaseStops.length}. {guide.energy}.
        </span>
        <strong>{guide.label}</strong>
        <span>{guide.description}</span>
      </output>

      <fieldset className="escapement-control-row">
        <legend className="sr-only">Escapement phase controls</legend>
        <button onClick={() => props.lesson.step(-1)} type="button">
          Previous
        </button>
        <button
          aria-pressed={snapshot.playing}
          disabled={props.reducedMotion}
          onClick={() => props.lesson.togglePlayback()}
          type="button"
        >
          {snapshot.playing ? "Pause" : "Play cycle"}
        </button>
        <button onClick={() => props.lesson.step(1)} type="button">
          Next
        </button>
      </fieldset>

      <label className="escapement-rate">
        <span>Study speed</span>
        <select onChange={changeRate} value={snapshot.rate}>
          <option value="slow">Slow</option>
          <option value="normal">Normal</option>
        </select>
      </label>

      {props.reducedMotion ? (
        <p className="escapement-motion-note">Auto-play is off. Previous and Next still work.</p>
      ) : null}
    </div>
  )
}

function parsePlaybackRate(value: string): EscapementPlaybackRate {
  return value === "normal" ? "normal" : "slow"
}
