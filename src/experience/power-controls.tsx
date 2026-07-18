import { useEffect, useSyncExternalStore, type ChangeEvent } from "react"

import { powerRatioFacts, powerStatusGuides } from "../content/power"
import type { PowerLesson, PowerPlaybackRate } from "./power-lesson"

/** Renders accessible controls for winding and studying the generic going train. */
export function PowerControls(props: { lesson: PowerLesson; reducedMotion: boolean }) {
  const snapshot = useSyncExternalStore(props.lesson.subscribe, props.lesson.getSnapshot, props.lesson.getSnapshot)
  const guide = powerStatusGuides[snapshot.status]

  useEffect(() => {
    if (props.reducedMotion && snapshot.playing) props.lesson.togglePlayback()
  }, [props.lesson, props.reducedMotion, snapshot.playing])

  const changeRate = (event: ChangeEvent<HTMLSelectElement>) => {
    props.lesson.setRate(parsePlaybackRate(event.currentTarget.value))
  }

  return (
    <div className="lesson-controls" data-testid="power-controls">
      <div className="lesson-heading">
        <span>Watch time {formatTime(snapshot.displayedSeconds)}</span>
        <span>{snapshot.wound ? "spring wound" : "no stored energy"}</span>
      </div>

      <output aria-atomic="true" aria-live={snapshot.playing ? "off" : "polite"} className="lesson-output">
        <strong>{guide.label}</strong>
        <span>{guide.description}</span>
      </output>

      <dl className="lesson-ratios">
        {powerRatioFacts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>

      <fieldset className="lesson-control-row">
        <legend className="sr-only">Power train controls</legend>
        <button onClick={() => props.lesson.wind()} type="button">
          Wind spring
        </button>
        <button
          aria-pressed={snapshot.playing}
          disabled={props.reducedMotion || !snapshot.wound}
          onClick={() => props.lesson.togglePlayback()}
          type="button"
        >
          {snapshot.playing ? "Pause train" : "Run train"}
        </button>
        <button disabled={!snapshot.wound} onClick={() => props.lesson.step()} type="button">
          +10 sec
        </button>
      </fieldset>

      <label className="lesson-rate">
        <span>Study speed</span>
        <select onChange={changeRate} value={snapshot.rate}>
          <option value="slow">Slow</option>
          <option value="normal">Normal</option>
        </select>
      </label>

      {props.reducedMotion ? <p className="lesson-motion-note">Auto-run is off. Wind and +10 sec still work.</p> : null}
    </div>
  )
}

function parsePlaybackRate(value: string): PowerPlaybackRate {
  return value === "normal" ? "normal" : "slow"
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}
