import { useEffect, useSyncExternalStore } from "react"

import { systemRoleFacts, systemStatusGuides } from "../content/system"
import type { SystemLesson } from "./system-lesson"

/** Renders accessible controls for tracing the complete illustrative watch system. */
export function SystemControls(props: { lesson: SystemLesson; reducedMotion: boolean }) {
  const snapshot = useSyncExternalStore(props.lesson.subscribe, props.lesson.getSnapshot, props.lesson.getSnapshot)
  const guide = systemStatusGuides[snapshot.status]

  useEffect(() => {
    if (props.reducedMotion && snapshot.playing) props.lesson.togglePlayback()
  }, [props.lesson, props.reducedMotion, snapshot.playing])

  return (
    <div className="lesson-controls" data-testid="system-controls">
      <div className="lesson-heading">
        <span>Integrated time {snapshot.displayedMinutes} min</span>
        <span>{snapshot.wound ? "spring loaded" : "no stored energy"}</span>
      </div>

      <output aria-atomic="true" aria-live={snapshot.playing ? "off" : "polite"} className="lesson-output">
        <strong>{guide.label}</strong>
        <span>{guide.description}</span>
      </output>

      <dl className="lesson-ratios mt-[0.9rem] grid grid-cols-3 gap-2">
        {systemRoleFacts.map((fact) => (
          <div className="min-w-0 pt-[0.55rem]" key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>

      <fieldset className="lesson-control-row">
        <legend className="sr-only">Integrated watch controls</legend>
        <button onClick={() => props.lesson.wind()} type="button">
          Wind system
        </button>
        <button
          aria-pressed={snapshot.playing}
          disabled={props.reducedMotion || !snapshot.wound}
          onClick={() => props.lesson.togglePlayback()}
          type="button"
        >
          {snapshot.playing ? "Pause system" : "Run system"}
        </button>
        <button disabled={!snapshot.wound} onClick={() => props.lesson.step()} type="button">
          +10 min
        </button>
      </fieldset>

      <p className="lesson-motion-note">
        {props.reducedMotion ? "Auto-run is off. Wind and +10 min still work. " : null}
        Relative speeds are compressed for study, not caliber timing.
      </p>
    </div>
  )
}
