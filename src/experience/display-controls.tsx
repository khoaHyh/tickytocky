import { useEffect, useSyncExternalStore } from "react"

import { displayRatioFacts, displayStatusGuides } from "../content/display"
import type { DisplayLesson } from "./display-lesson"

/** Renders accessible controls for studying the generic hour-and-minute display. */
export function DisplayControls(props: { lesson: DisplayLesson; reducedMotion: boolean }) {
  const snapshot = useSyncExternalStore(props.lesson.subscribe, props.lesson.getSnapshot, props.lesson.getSnapshot)
  const guide = displayStatusGuides[snapshot.status]

  useEffect(() => {
    if (props.reducedMotion && snapshot.playing) props.lesson.togglePlayback()
  }, [props.lesson, props.reducedMotion, snapshot.playing])

  return (
    <div className="lesson-controls" data-testid="display-controls">
      <div className="lesson-heading">
        <span>Elapsed display time {snapshot.displayedMinutes} min</span>
        <span>generic hand ratio</span>
      </div>

      <output aria-atomic="true" aria-live={snapshot.playing ? "off" : "polite"} className="lesson-output">
        <strong>{guide.label}</strong>
        <span>{guide.description}</span>
      </output>

      <dl className="lesson-ratios mt-[0.9rem] grid grid-cols-3 gap-2">
        {displayRatioFacts.map((fact) => (
          <div className="min-w-0 pt-[0.55rem]" key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>

      <fieldset className="lesson-control-row">
        <legend className="sr-only">Display controls</legend>
        <button onClick={() => props.lesson.reset()} type="button">
          Reset
        </button>
        <button
          aria-pressed={snapshot.playing}
          disabled={props.reducedMotion}
          onClick={() => props.lesson.togglePlayback()}
          type="button"
        >
          {snapshot.playing ? "Pause hands" : "Play hands"}
        </button>
        <button onClick={() => props.lesson.step()} type="button">
          +10 min
        </button>
      </fieldset>

      {props.reducedMotion ? (
        <p className="lesson-motion-note">Auto-play is off. Reset and +10 min still work.</p>
      ) : null}
    </div>
  )
}
