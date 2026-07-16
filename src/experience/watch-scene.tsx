import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef, type ReactNode } from "react"
import { MathUtils, type Group } from "three"

import type { StoryProgress } from "./story-progress"

type Point = readonly [number, number, number]
type PartID = "balance" | "barrel" | "case" | "dial" | "escapement" | "hands" | "train"
type PartDefinition = {
  id: PartID
  assembled: Point
  exploded: Point
  mobileExploded: Point
  range: readonly [number, number]
}

const parts: readonly PartDefinition[] = [
  { id: "case", assembled: [0, 0, 0], exploded: [0, 0, -0.5], mobileExploded: [0, 0, -0.5], range: [0.75, 1] },
  {
    id: "dial",
    assembled: [0, 0, 0.24],
    exploded: [-2.2, 1.45, 1.2],
    mobileExploded: [-2, 1.3, 1.2],
    range: [0, 0.25],
  },
  {
    id: "hands",
    assembled: [0, 0, 0.42],
    exploded: [-2.2, -1.25, 1.7],
    mobileExploded: [-2, -1.1, 1.7],
    range: [0, 0.25],
  },
  {
    id: "barrel",
    assembled: [-0.72, 0.64, 0.08],
    exploded: [0, 1.5, 1.25],
    mobileExploded: [0, 1.35, 1.25],
    range: [0.25, 0.5],
  },
  {
    id: "train",
    assembled: [0.62, 0.18, 0.1],
    exploded: [0, -1.25, 1.45],
    mobileExploded: [0, -1.1, 1.45],
    range: [0.25, 0.5],
  },
  {
    id: "escapement",
    assembled: [0.76, -0.84, 0.14],
    exploded: [2.2, 1.35, 1.65],
    mobileExploded: [2, 1.2, 1.65],
    range: [0.5, 0.75],
  },
  {
    id: "balance",
    assembled: [-0.76, -0.82, 0.16],
    exploded: [2.2, -1.25, 1.9],
    mobileExploded: [2, -1.1, 1.9],
    range: [0.5, 0.75],
  },
]

/** Renders the demand-driven Three.js graybox scene for the watch lesson. */
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

function Scene(props: { progress: StoryProgress }) {
  const assembly = useRef<Group>(null)
  const invalidate = useThree((state) => state.invalidate)
  const width = useThree((state) => state.size.width)

  useEffect(() => props.progress.attachRenderer(invalidate), [invalidate, props.progress])

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
        {parts.map((part) => (
          <AnimatedPart compact={width < 640} key={part.id} part={part} progress={props.progress}>
            <Part id={part.id} />
          </AnimatedPart>
        ))}
      </group>
    </>
  )
}

function AnimatedPart(props: { children: ReactNode; compact: boolean; part: PartDefinition; progress: StoryProgress }) {
  const group = useRef<Group>(null)

  useFrame(() => {
    const target = group.current
    if (!target) return

    const progress = partProgress(props.progress.read(), props.part.range)
    const exploded = props.compact ? props.part.mobileExploded : props.part.exploded
    target.position.set(
      MathUtils.lerp(props.part.assembled[0], exploded[0], progress),
      MathUtils.lerp(props.part.assembled[1], exploded[1], progress),
      MathUtils.lerp(props.part.assembled[2], exploded[2], progress),
    )
  })

  return <group ref={group}>{props.children}</group>
}

function Part(props: { id: PartID }) {
  const id = props.id
  switch (id) {
    case "case":
      return <Case />
    case "dial":
      return <Dial />
    case "hands":
      return <Hands />
    case "barrel":
      return <Barrel />
    case "train":
      return <Train />
    case "escapement":
      return <Escapement />
    case "balance":
      return <Balance />
  }

  const exhaustive: never = id
  return exhaustive
}

function Case() {
  return (
    <group>
      <mesh>
        <torusGeometry args={[2.45, 0.2, 24, 96]} />
        <meshStandardMaterial color="#b5b7b5" metalness={0.9} roughness={0.26} />
      </mesh>
      <mesh position={[0, 0, -0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.2, 2.2, 0.16, 96]} />
        <meshStandardMaterial color="#31312d" metalness={0.72} roughness={0.46} />
      </mesh>
      <mesh position={[2.62, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.28, 0.28, 0.48, 32]} />
        <meshStandardMaterial color="#a6a8a5" metalness={0.9} roughness={0.3} />
      </mesh>
    </group>
  )
}

function Dial() {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.18, 2.18, 0.12, 96]} />
        <meshStandardMaterial color="#232421" metalness={0.2} roughness={0.65} />
      </mesh>
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

function Hands() {
  return (
    <group>
      <mesh position={[0, 0.58, 0]}>
        <boxGeometry args={[0.09, 1.2, 0.07]} />
        <meshStandardMaterial color="#e4ded1" metalness={0.75} roughness={0.3} />
      </mesh>
      <mesh position={[0.55, -0.02, 0.04]} rotation={[0, 0, -Math.PI / 2]}>
        <boxGeometry args={[0.07, 1.1, 0.05]} />
        <meshStandardMaterial color="#bd4e3a" metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.12, 32]} />
        <meshStandardMaterial color="#d9d3c7" metalness={0.8} roughness={0.28} />
      </mesh>
    </group>
  )
}

function Barrel() {
  return (
    <group>
      <Gear color="#b38a42" radius={0.72} />
      <mesh position={[0, 0, 0.09]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.48, 0.48, 0.18, 48]} />
        <meshStandardMaterial color="#8b6b38" metalness={0.78} roughness={0.4} />
      </mesh>
    </group>
  )
}

function Train() {
  return (
    <group>
      <group position={[-0.45, 0.36, 0]}>
        <Gear color="#9da39f" radius={0.46} />
      </group>
      <group position={[0.42, 0.18, 0.04]}>
        <Gear color="#c2a566" radius={0.38} />
      </group>
      <group position={[0.12, -0.55, 0.08]}>
        <Gear color="#8d9695" radius={0.3} />
      </group>
    </group>
  )
}

function Escapement() {
  return (
    <group>
      <Gear color="#bd4e3a" radius={0.46} />
      <group position={[-0.58, -0.34, 0.08]} rotation={[0, 0, -0.42]}>
        <mesh>
          <boxGeometry args={[0.7, 0.12, 0.1]} />
          <meshStandardMaterial color="#c6c9c5" metalness={0.82} roughness={0.32} />
        </mesh>
        <mesh position={[-0.32, 0.12, 0]}>
          <boxGeometry args={[0.16, 0.28, 0.12]} />
          <meshStandardMaterial color="#c65b61" metalness={0.25} roughness={0.3} />
        </mesh>
      </group>
    </group>
  )
}

function Balance() {
  return (
    <group>
      <mesh>
        <torusGeometry args={[0.64, 0.08, 18, 64]} />
        <meshStandardMaterial color="#d0b16b" metalness={0.86} roughness={0.28} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.34, 0.025, 12, 64]} />
        <meshStandardMaterial color="#55787f" metalness={0.62} roughness={0.38} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.18, 24]} />
        <meshStandardMaterial color="#d9d3c7" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

function Gear(props: { color: string; radius: number }) {
  return (
    <group>
      <mesh>
        <torusGeometry args={[props.radius, props.radius * 0.1, 12, 48]} />
        <meshStandardMaterial color={props.color} metalness={0.78} roughness={0.36} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[props.radius * 0.16, props.radius * 0.16, 0.14, 24]} />
        <meshStandardMaterial color={props.color} metalness={0.78} roughness={0.36} />
      </mesh>
      {[0, Math.PI / 2].map((rotation) => (
        <mesh key={rotation} rotation={[0, 0, rotation]}>
          <boxGeometry args={[props.radius * 1.8, props.radius * 0.09, 0.08]} />
          <meshStandardMaterial color={props.color} metalness={0.78} roughness={0.36} />
        </mesh>
      ))}
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
