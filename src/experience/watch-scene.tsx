import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef, type ReactNode, type RefObject } from "react"
import { MathUtils, type Group } from "three"

import type { EscapementLesson } from "./escapement-lesson"
import type { PowerLesson } from "./power-lesson"
import type { StoryProgress } from "./story-progress"
import { preloadWatchModel, WatchModel, type WatchModelParts, type WatchModelPoint } from "./watch-model"

type PartID = keyof WatchModelParts
type FocusGroup = "power" | "regulation"
type PartDefinition = {
  id: PartID
  exploded: WatchModelPoint
  focus: WatchModelPoint
  focusGroup?: FocusGroup
  mobileExploded: WatchModelPoint
  mobileFocus: WatchModelPoint
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
    focus: [-0.41, 0.438, 2.1],
    focusGroup: "power",
    mobileExploded: [0, 1.35, 1.25],
    mobileFocus: [-0.803, 3.8, 2.1],
    range: [0.25, 0.5],
  },
  {
    id: "train",
    exploded: [0, -1.25, 1.45],
    focus: [0.41, -0.288, 2.1],
    focusGroup: "power",
    mobileExploded: [0, -1.1, 1.45],
    mobileFocus: [0.803, 3.8, 2.1],
    range: [0.25, 0.5],
  },
  {
    id: "escapement",
    exploded: [2.2, 1.35, 1.65],
    focus: [0.4, 0.8, 2.1],
    focusGroup: "regulation",
    mobileExploded: [2, 1.2, 1.65],
    mobileFocus: [-0.9, 3.8, 2.1],
    range: [0.5, 0.75],
  },
  {
    id: "balance",
    exploded: [2.2, -1.25, 1.9],
    focus: [0.4, -0.75, 2.1],
    focusGroup: "regulation",
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
  barrelArbor: RefObject<Group | null>
  barrelDrum: RefObject<Group | null>
  centerWheel: RefObject<Group | null>
  escapeWheel: RefObject<Group | null>
  fourthWheel: RefObject<Group | null>
  hairspring: RefObject<Group | null>
  mainspring: RefObject<Group | null>
  palletFork: RefObject<Group | null>
  thirdWheel: RefObject<Group | null>
}>

/** Renders the demand-driven Three.js watch scene for the lesson. */
export function WatchScene(props: {
  lesson: EscapementLesson
  powerLesson: PowerLesson
  progress: StoryProgress
  reducedMotion: boolean
}) {
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
        <Scene
          lesson={props.lesson}
          powerLesson={props.powerLesson}
          progress={props.progress}
          reducedMotion={props.reducedMotion}
        />
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

function Scene(props: {
  lesson: EscapementLesson
  powerLesson: PowerLesson
  progress: StoryProgress
  reducedMotion: boolean
}) {
  const assembly = useRef<Group>(null)
  const escapeWheel = useRef<Group>(null)
  const palletFork = useRef<Group>(null)
  const balance = useRef<Group>(null)
  const hairspring = useRef<Group>(null)
  const barrelArbor = useRef<Group>(null)
  const barrelDrum = useRef<Group>(null)
  const mainspring = useRef<Group>(null)
  const centerWheel = useRef<Group>(null)
  const thirdWheel = useRef<Group>(null)
  const fourthWheel = useRef<Group>(null)
  const invalidate = useThree((state) => state.invalidate)
  const width = useThree((state) => state.size.width)

  useEffect(() => props.progress.attachRenderer(invalidate), [invalidate, props.progress])
  useEffect(() => props.lesson.attachRenderer(invalidate), [invalidate, props.lesson])
  useEffect(() => props.powerLesson.attachRenderer(invalidate), [invalidate, props.powerLesson])
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
    const power = props.reducedMotion ? props.powerLesson.read() : props.powerLesson.tick(deltaSeconds)
    const focus = lessonFocus(progress)
    const mechanismScale = 1 + focus.regulation * (compact ? 1.35 : 0.55)
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

    if (barrelDrum.current) {
      barrelDrum.current.rotation.z = turnsToRadians(power.pose.barrelTurns)
    }
    if (barrelArbor.current) {
      barrelArbor.current.rotation.z = turnsToRadians(power.pose.barrelArborTurns)
    }
    if (mainspring.current) {
      const springScale = 1.15 - power.pose.mainspringWind * 0.25
      mainspring.current.scale.set(springScale, springScale, 1)
    }
    if (centerWheel.current) {
      centerWheel.current.rotation.z = turnsToRadians(power.pose.centerTurns)
    }
    if (thirdWheel.current) {
      thirdWheel.current.rotation.z = turnsToRadians(power.pose.thirdTurns)
    }
    if (fourthWheel.current) {
      fourthWheel.current.rotation.z = turnsToRadians(power.pose.fourthTurns)
    }

    if (!props.reducedMotion && (props.lesson.getSnapshot().playing || props.powerLesson.getSnapshot().playing))
      invalidate()
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
                  targets={{
                    balance,
                    barrelArbor,
                    barrelDrum,
                    centerWheel,
                    escapeWheel,
                    fourthWheel,
                    hairspring,
                    mainspring,
                    palletFork,
                    thirdWheel,
                  }}
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
      return (
        <>
          <group ref={props.targets.barrelDrum} position={pointToPosition(props.model.barrel.drum.offset)}>
            {props.model.barrel.drum.content}
          </group>
          <group ref={props.targets.barrelArbor} position={pointToPosition(props.model.barrel.arbor.offset)}>
            {props.model.barrel.arbor.content}
          </group>
          <group ref={props.targets.mainspring} position={pointToPosition(props.model.barrel.mainspring.offset)}>
            {props.model.barrel.mainspring.content}
          </group>
        </>
      )
    case "case":
      return props.model.case.content
    case "dial":
      return props.model.dial.content
    case "hands":
      return props.model.hands.content
    case "train":
      return (
        <>
          <group ref={props.targets.centerWheel} position={pointToPosition(props.model.train.centerWheel.offset)}>
            {props.model.train.centerWheel.content}
          </group>
          <group ref={props.targets.thirdWheel} position={pointToPosition(props.model.train.thirdWheel.offset)}>
            {props.model.train.thirdWheel.content}
          </group>
          <group ref={props.targets.fourthWheel} position={pointToPosition(props.model.train.fourthWheel.offset)}>
            {props.model.train.fourthWheel.content}
          </group>
        </>
      )
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
    const focus = lessonFocus(storyProgress)
    const partFocus = props.part.focusGroup ? focus[props.part.focusGroup] : 0
    const totalFocus = Math.max(focus.power, focus.regulation)
    const focusScale = 1 - totalFocus + partFocus
    const detailScale = props.part.focusGroup === "power" ? 1 + partFocus * (props.compact ? 1.2 : 0.5) : 1
    target.position.set(
      MathUtils.lerp(base[0], focusTarget[0], partFocus),
      MathUtils.lerp(base[1], focusTarget[1], partFocus),
      MathUtils.lerp(base[2], focusTarget[2], partFocus),
    )
    target.scale.setScalar(Math.max(0.001, focusScale) * detailScale)
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
  const powerFadeIn = partProgress(progress, [0.25, 0.42])
  const powerFadeOut = 1 - partProgress(progress, [0.54, 0.68])
  const regulationFadeIn = partProgress(progress, [0.55, 0.7])
  const regulationFadeOut = 1 - partProgress(progress, [0.82, 1])
  return {
    power: Math.min(powerFadeIn, powerFadeOut),
    regulation: Math.min(regulationFadeIn, regulationFadeOut),
  }
}

function pointToPosition(point: WatchModelPoint): [number, number, number] {
  return [point[0], point[1], point[2]]
}

function turnsToRadians(turns: number) {
  return turns * Math.PI * 2
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
