import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef, type ReactNode } from "react"
import { MathUtils, type Group } from "three"

import type { StoryProgress } from "./story-progress"
import { preloadWatchModel, WatchModel, type WatchModelParts, type WatchModelPoint } from "./watch-model"

type PartID = keyof WatchModelParts
type PartDefinition = {
  id: PartID
  exploded: WatchModelPoint
  mobileExploded: WatchModelPoint
  range: readonly [number, number]
}

const parts: readonly PartDefinition[] = [
  { id: "case", exploded: [0, 0, -0.5], mobileExploded: [0, 0, -0.5], range: [0.75, 1] },
  {
    id: "dial",
    exploded: [-2.2, 1.45, 1.2],
    mobileExploded: [-2, 1.3, 1.2],
    range: [0, 0.25],
  },
  {
    id: "hands",
    exploded: [-2.2, -1.25, 1.7],
    mobileExploded: [-2, -1.1, 1.7],
    range: [0, 0.25],
  },
  {
    id: "barrel",
    exploded: [0, 1.5, 1.25],
    mobileExploded: [0, 1.35, 1.25],
    range: [0.25, 0.5],
  },
  {
    id: "train",
    exploded: [0, -1.25, 1.45],
    mobileExploded: [0, -1.1, 1.45],
    range: [0.25, 0.5],
  },
  {
    id: "escapement",
    exploded: [2.2, 1.35, 1.65],
    mobileExploded: [2, 1.2, 1.65],
    range: [0.5, 0.75],
  },
  {
    id: "balance",
    exploded: [2.2, -1.25, 1.9],
    mobileExploded: [2, -1.1, 1.9],
    range: [0.5, 0.75],
  },
]

/** Renders the demand-driven Three.js watch scene for the lesson. */
export function WatchScene(props: { progress: StoryProgress }) {
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
        <Scene progress={props.progress} />
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

function Scene(props: { progress: StoryProgress }) {
  const assembly = useRef<Group>(null)
  const invalidate = useThree((state) => state.invalidate)
  const width = useThree((state) => state.size.width)

  useEffect(() => props.progress.attachRenderer(invalidate), [invalidate, props.progress])
  useEffect(() => invalidate(), [invalidate, width])

  useFrame(({ camera }) => {
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
                {model[part.id].content}
                {part.id === "dial" ? <DialMarkers /> : null}
              </AnimatedPart>
            ))
          }
        </WatchModel>
      </group>
    </>
  )
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

    const progress = partProgress(props.progress.read(), props.part.range)
    const exploded = props.compact ? props.part.mobileExploded : props.part.exploded
    target.position.set(
      MathUtils.lerp(props.assembled[0], exploded[0], progress),
      MathUtils.lerp(props.assembled[1], exploded[1], progress),
      MathUtils.lerp(props.assembled[2], exploded[2], progress),
    )
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
