import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react"

import { DisplayControls } from "./display-controls"
import { createDisplayLesson } from "./display-lesson"
import { EscapementControls } from "./escapement-controls"
import { createEscapementLesson } from "./escapement-lesson"
import { PowerControls } from "./power-controls"
import { createPowerLesson } from "./power-lesson"
import {
  createStoryProgress,
  describeAssembly,
  measureStoryProgress,
  reduceMotion,
  stageStoryProgress,
} from "./story-progress"
import { SystemControls } from "./system-controls"
import { createSystemLesson } from "./system-lesson"

const chapters = 5
const WatchScene = lazy(async () => {
  const scene = await import("./watch-scene")
  scene.preloadWatchScene()
  return { default: scene.WatchScene }
})

/** Renders the scroll-driven watch lesson and its semantic HTML explanation. */
export function WatchExperience() {
  const story = useRef<HTMLElement>(null)
  const status = useRef<HTMLOutputElement>(null)
  const progress = useMemo(() => createStoryProgress(), [])
  const displayLesson = useMemo(() => createDisplayLesson(), [])
  const lesson = useMemo(() => createEscapementLesson(), [])
  const powerLesson = useMemo(() => createPowerLesson(), [])
  const systemLesson = useMemo(
    () => createSystemLesson({ displayLesson, escapementLesson: lesson, powerLesson }),
    [displayLesson, lesson, powerLesson],
  )
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const element = story.current
    const output = status.current
    if (!element || !output) return undefined

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let frame: number | undefined

    const update = () => {
      frame = undefined
      const measured = measureStoryProgress({
        top: element.getBoundingClientRect().top,
        height: element.offsetHeight,
        viewportHeight: window.innerHeight,
      })
      const chapterProgress = motion.matches ? reduceMotion(measured, chapters - 1) : measured
      const next = stageStoryProgress(chapterProgress, chapters - 1)
      const assembly = describeAssembly(next)

      progress.write(next)
      element.style.setProperty("--story-progress", next.toFixed(3))
      output.dataset.progress = next.toFixed(3)
      output.dataset.state = assembly.kind
      if (output.textContent !== assembly.label) output.textContent = assembly.label
    }

    const schedule = () => {
      if (frame !== undefined) return
      frame = requestAnimationFrame(update)
    }

    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    const motionChanged = () => {
      setReducedMotion(motion.matches)
      schedule()
    }

    motion.addEventListener("change", motionChanged)
    motionChanged()

    return () => {
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      motion.removeEventListener("change", motionChanged)
      if (frame !== undefined) cancelAnimationFrame(frame)
    }
  }, [progress])

  return (
    <main ref={story} className="story-root relative overflow-x-clip bg-canvas text-ink">
      <div className="sticky top-0 h-dvh overflow-hidden">
        <div aria-hidden="true" className="movement-grid absolute inset-0" />
        <div aria-hidden="true" className="movement-glow absolute" />
        <Suspense
          fallback={<p className="grid h-full place-items-center font-mono text-xs text-muted">Loading movement…</p>}
        >
          <WatchScene
            displayLesson={displayLesson}
            lesson={lesson}
            powerLesson={powerLesson}
            progress={progress}
            reducedMotion={reducedMotion}
            systemLesson={systemLesson}
          />
        </Suspense>

        <div aria-hidden="true" className="part-label-layer hidden lg:block">
          <span className="part-label part-label-display">Dial + hands</span>
          <span className="part-label part-label-barrel">Mainspring barrel</span>
          <span className="part-label part-label-train">Gear train</span>
          <span className="part-label part-label-escapement">Escapement</span>
          <span className="part-label part-label-balance">Balance</span>
        </div>

        <div aria-hidden="true" className="absolute right-5 bottom-6 z-20 hidden items-end gap-3 md:flex">
          <span className="font-mono text-[0.625rem] tracking-[0.2em] text-muted uppercase">Assembly</span>
          <span className="progress-track">
            <span className="progress-fill" />
          </span>
          <span className="flex h-24 flex-col justify-between font-mono text-[0.625rem] text-accent-text">
            <span>01</span>
            <span>05</span>
          </span>
        </div>

        <output
          ref={status}
          aria-live="polite"
          className="sr-only"
          data-progress="0.000"
          data-state="assembled"
          data-testid="assembly-status"
        >
          Watch assembled
        </output>
      </div>

      <div className="relative z-10 -mt-[100dvh]">
        <section className="story-chapter items-end md:items-center">
          <div className="story-copy mr-auto">
            <p className="story-kicker">A mechanical watch atlas</p>
            <h1 className="font-display text-6xl leading-[0.86] font-semibold tracking-[-0.065em] sm:text-8xl lg:text-9xl">
              TickyTocky
            </h1>
            <p className="mt-6 max-w-md text-lg leading-7 text-muted sm:text-xl">
              An interactive guide to mechanical watches.
            </p>
            <p className="mt-10 font-mono text-xs tracking-[0.16em] text-accent-text uppercase">
              Scroll to disassemble
            </p>
          </div>
        </section>

        <section className="story-chapter items-start md:items-center">
          <div className="display-story-copy lesson-story-copy story-copy ml-auto md:max-w-md">
            <p className="story-kicker">01 / Display</p>
            <h2 className="story-title">Motion made readable</h2>
            <p className="story-body">
              The minute and hour hands turn at a 12:1 ratio, translating the movement's internal motion into elapsed
              time you can read.
            </p>
            <DisplayControls lesson={displayLesson} reducedMotion={reducedMotion} />
          </div>
        </section>

        <section className="story-chapter items-end md:items-center">
          <div className="lesson-story-copy story-copy mr-auto md:max-w-md">
            <p className="story-kicker">02 / Power</p>
            <h2 className="story-title">Stored, then released</h2>
            <p className="story-body">
              The barrel stores energy in the mainspring. The gear train carries that energy toward the escapement.
            </p>
            <PowerControls lesson={powerLesson} reducedMotion={reducedMotion} />
          </div>
        </section>

        <section className="story-chapter items-start md:items-center">
          <div className="lesson-story-copy story-copy ml-auto md:max-w-md">
            <p className="story-kicker">03 / Regulation</p>
            <h2 className="story-title">A controlled escape</h2>
            <p className="story-body">
              The escape wheel, pallet fork, and balance turn continuous spring force into a measured sequence of beats.
            </p>
            <EscapementControls lesson={lesson} reducedMotion={reducedMotion} />
          </div>
        </section>

        <section className="story-chapter items-end md:items-center">
          <div className="lesson-story-copy story-copy mr-auto md:max-w-md">
            <p className="story-kicker">04 / Assembly</p>
            <h2 className="story-title">One system, many jobs</h2>
            <p className="story-body">
              Each group has a distinct role. Together they form a compact chain from stored energy to displayed time.
            </p>
            <SystemControls lesson={systemLesson} reducedMotion={reducedMotion} />
          </div>
        </section>
      </div>
    </main>
  )
}
