import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef, type ReactNode, type RefObject } from "react"
import { MathUtils, type Group } from "three"

import type { EscapementLesson } from "./escapement-lesson"
import type { StoryProgress } from "./story-progress"
import { preloadWatchModel, WatchModel, type WatchModelParts, type WatchModelPoint } from "./watch-model"

type PartID = keyof WatchModelParts
type PartDefinition = {
  id: PartID
  exploded: WatchModelPoint
  focus?: WatchModelPoint
  mobileExploded: WatchModelPoint
  mobileFocus?: WatchModelPoint
  range: readonly [number, number]
}

const parts: readonly PartDefinition[] = [
  {
    id: "case",
    exploded: [0, 0, -0.5],
    focus: [-5, 0, -2],
    mobileExploded: [0, 0, -0.5],
    mobileFocus: [0, -6, -2],
    range: [0.75, 1],
  },
  {
    id: "dial",
    exploded: [-2.2, 1.45, 1.2],
    focus: [-5, 2, -2],
    mobileExploded: [-2, 1.3, 1.2],
    mobileFocus: [-5, 0, -2],
    range: [0, 0.25],
  },
  {
    id: "hands",
    exploded: [-2.2, -1.25, 1.7],
    focus: [-5, -2, -2],
    mobileExploded: [-2, -1.1, 1.7],
    mobileFocus: [-5, -4, -2],
    range: [0, 0.25],
  },
  {
    id: "barrel",
    exploded: [0, 1.5, 1.25],
    focus: [0, 5, -2],
    mobileExploded: [0, 1.35, 1.25],
    mobileFocus: [5, 0, -2],
    range: [0.25, 0.5],
  },
  {
    id: "train",
    exploded: [0, -1.25, 1.45],
    focus: [0, -5, -2],
    mobileExploded: [0, -1.1, 1.45],
    mobileFocus: [5, -4, -2],
    range: [0.25, 0.5],
  },
  {
    id: "escapement",
    exploded: [2.2, 1.35, 1.65],
    focus: [0.4, 0.8, 2.1],
    mobileExploded: [2, 1.2, 1.65],
    mobileFocus: [-0.9, 3.8, 2.1],
    range: [0.5, 0.75],
  },
  {
    id: "balance",
    exploded: [2.2, -1.25, 1.9],
    focus: [0.4, -0.75, 2.1],
    mobileExploded: [2, -1.1, 1.9],
    mobileFocus: [0.9, 3.8, 2.1],
    range: [0.5, 0.75],
  },
]

const escapeWheelToothPitch = (Math.PI * 2) / 15
const palletBankAngle = 0.16
const balanceAmplitude = 0.58

type MechanismTargets = Readonly<{
  balance: RefObject<Group | null>
  escapeWheel: RefObject<Group | null>
  hairspring: RefObject<Group | null>
  palletFork: RefObject<Group | null>
}>

/** Renders the demand-driven Three.js watch scene for the lesson. */
export function WatchScene(props: { lesson: EscapementLesson; progress: StoryProgress; reducedMotion: boolean }) {
  return (
    <figure aria-label="Exploded mechanical watch model" className="absolute inset-0 z-0" data-testid="watch-scene">
      <Canvas
        aria-hidden="true"
        camera={{ far: 100, fov: 42, near: 0.1, position: [0, 0, 12] }}
        dpr={[1, 1.5]}
        fallback={<p className="grid h-full place-items-center px-8 text-center text-muted">3D view unavailable.</p>}
        frameloop="demand"
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <Scene lesson={props.lesson} progress={props.progress} reducedMotion={props.reducedMotion} />
      </Canvas>
      <figcaption className="sr-only">
        A mechanical watch separates into its display, power, and regulating parts.
      </figcaption>
    </figure>
  )
}

/** Preloads the watch scene's shared model without taking ownership of its cached resources. */
export function preloadWatchScene() {
  preloadWatchModel()
}

function Scene(props: { lesson: EscapementLesson; progress: StoryProgress; reducedMotion: boolean }) {
  const assembly = useRef<Group>(null)
  const escapeWheel = useRef<Group>(null)
  const palletFork = useRef<Group>(null)
  const balance = useRef<Group>(null)
  const hairspring = useRef<Group>(null)
  const invalidate = useThree((state) => state.invalidate)
  const width = useThree((state) => state.size.width)

  useEffect(() => props.progress.attachRenderer(invalidate), [invalidate, props.progress])
  useEffect(() => props.lesson.attachRenderer(invalidate), [invalidate, props.lesson])
  useEffect(() => invalidate(), [invalidate, props.reducedMotion, width])

  useFrame(({ camera }, deltaSeconds) => {
    const progress = props.progress.read()
    const group = assembly.current
    if (!group) return

    const compact = width < 640
    const scale = compact ? 0.55 : width < 960 ? 0.76 : 1
    group.scale.setScalar(scale)
    group.position.x = compact ? 0 : sample([1.2, -1.05, 1.1, -1, 1.15], progress)
    group.position.y = compact ? 1.3 : 0
    group.rotation.x = MathUtils.lerp(-0.08, -0.28, progress)
    group.rotation.y = MathUtils.lerp(-0.12, 0.16, progress)
    group.rotation.z = MathUtils.lerp(-0.04, 0.02, progress)

    camera.position.x = 0
    camera.position.y = compact ? 0.3 : MathUtils.lerp(0.1, 0.25, progress)
    camera.position.z = compact ? 13.5 : MathUtils.lerp(12, 13.5, progress)
    camera.lookAt(0, 0, 0)

    const mechanism = props.reducedMotion ? props.lesson.read() : props.lesson.tick(deltaSeconds)
    const mechanismScale = 1 + lessonFocus(progress) * (compact ? 1.35 : 0.55)
    if (escapeWheel.current) {
      escapeWheel.current.rotation.z = -mechanism.pose.escapeWheelAdvance * escapeWheelToothPitch
      escapeWheel.current.scale.setScalar(mechanismScale)
    }
    if (palletFork.current) {
      palletFork.current.rotation.z = mechanism.pose.palletPosition * palletBankAngle
      palletFork.current.scale.setScalar(mechanismScale)
    }
    if (balance.current) {
      balance.current.rotation.z = mechanism.pose.balancePosition * balanceAmplitude
      balance.current.scale.setScalar(mechanismScale)
    }
    if (hairspring.current) {
      const breathing = 1 - mechanism.pose.hairspringWind * 0.08
      hairspring.current.scale.set(breathing * mechanismScale, breathing * mechanismScale, mechanismScale)
    }

    if (!props.reducedMotion && props.lesson.getSnapshot().playing) invalidate()
  })

  return (
    <>
      <ambientLight intensity={1.4} />
      <directionalLight color="#fff4dc" intensity={3.4} position={[4, 5, 8]} />
      <pointLight color="#bd4e3a" intensity={22} position={[-4, -2, 5]} />

      <group ref={assembly}>
        <WatchModel>
          {(model) =>
            parts.map((part) => (
              <AnimatedPart
                assembled={model[part.id].assembled}
                compact={width < 640}
                key={part.id}
                part={part}
                progress={props.progress}
              >
                <ModelPartContent
                  id={part.id}
                  model={model}
                  targets={{ balance, escapeWheel, hairspring, palletFork }}
                />
                {part.id === "dial" ? <DialMarkers /> : null}
              </AnimatedPart>
            ))
          }
        </WatchModel>
      </group>
    </>
  )
}

function ModelPartContent(props: { id: PartID; model: WatchModelParts; targets: MechanismTargets }) {
  switch (props.id) {
    case "balance":
      return (
        <>
          <group ref={props.targets.balance} position={pointToPosition(props.model.balance.wheel.offset)}>
            {props.model.balance.wheel.content}
          </group>
          <group ref={props.targets.hairspring} position={pointToPosition(props.model.balance.hairspring.offset)}>
            {props.model.balance.hairspring.content}
          </group>
        </>
      )
    case "escapement":
      return (
        <>
          <group ref={props.targets.escapeWheel} position={pointToPosition(props.model.escapement.escapeWheel.offset)}>
            {props.model.escapement.escapeWheel.content}
          </group>
          <group ref={props.targets.palletFork} position={pointToPosition(props.model.escapement.palletFork.offset)}>
            {props.model.escapement.palletFork.content}
          </group>
        </>
      )
    case "barrel":
      return props.model.barrel.content
    case "case":
      return props.model.case.content
    case "dial":
      return props.model.dial.content
    case "hands":
      return props.model.hands.content
    case "train":
      return props.model.train.content
  }

  const exhaustive: never = props.id
  return exhaustive
}

function AnimatedPart(props: {
  assembled: WatchModelPoint
  children: ReactNode
  compact: boolean
  part: PartDefinition
  progress: StoryProgress
}) {
  const group = useRef<Group>(null)

  useFrame(() => {
    const target = group.current
    if (!target) return

    const storyProgress = props.progress.read()
    const progress = partProgress(storyProgress, props.part.range)
    const exploded = props.compact ? props.part.mobileExploded : props.part.exploded
    const base: WatchModelPoint = [
      MathUtils.lerp(props.assembled[0], exploded[0], progress),
      MathUtils.lerp(props.assembled[1], exploded[1], progress),
      MathUtils.lerp(props.assembled[2], exploded[2], progress),
    ]
    const focusTarget = props.compact ? props.part.mobileFocus : props.part.focus
    const focus = focusTarget ? lessonFocus(storyProgress) : 0
    const focusScale = isLessonPart(props.part.id) ? 1 : 1 - focus
    target.position.set(
      MathUtils.lerp(base[0], focusTarget?.[0] ?? base[0], focus),
      MathUtils.lerp(base[1], focusTarget?.[1] ?? base[1], focus),
      MathUtils.lerp(base[2], focusTarget?.[2] ?? base[2], focus),
    )
    target.scale.setScalar(Math.max(0.001, focusScale))
  })

  return <group ref={group}>{props.children}</group>
}

function DialMarkers() {
  return (
    <group>
      {Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * Math.PI * 2
        return (
          <mesh key={index} position={[Math.sin(angle) * 1.82, Math.cos(angle) * 1.82, 0.09]} rotation={[0, 0, -angle]}>
            <boxGeometry args={[0.06, index % 3 === 0 ? 0.3 : 0.2, 0.05]} />
            <meshStandardMaterial color="#d9d3c7" metalness={0.55} roughness={0.4} />
          </mesh>
        )
      })}
    </group>
  )
}

function partProgress(progress: number, range: readonly [number, number]) {
  if (progress <= range[0]) return 0
  if (progress >= range[1]) return 1
  const local = (progress - range[0]) / (range[1] - range[0])
  return local * local * (3 - 2 * local)
}

function lessonFocus(progress: number) {
  const fadeIn = partProgress(progress, [0.5, 0.7])
  const fadeOut = 1 - partProgress(progress, [0.82, 1])
  return Math.min(fadeIn, fadeOut)
}

function isLessonPart(id: PartID) {
  return id === "balance" || id === "escapement"
}

function pointToPosition(point: WatchModelPoint): [number, number, number] {
  return [point[0], point[1], point[2]]
}

function sample(values: readonly number[], progress: number) {
  if (values.length === 0) return 0
  if (values.length === 1 || progress <= 0) return values[0] ?? 0
  if (progress >= 1) return values.at(-1) ?? 0

  const scaled = progress * (values.length - 1)
  const index = Math.floor(scaled)
  const start = values[index] ?? 0
  const end = values[index + 1] ?? start
  return MathUtils.lerp(start, end, scaled - index)
}
