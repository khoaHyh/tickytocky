import { Clone, useGLTF } from "@react-three/drei"
import { type ReactNode } from "react"
import { Mesh } from "three"

const watchModelUrl = "/models/watch-model.glb"
const watchModelScale = 160

/** A scene-space position translated from the watch asset's authored coordinates. */
export type WatchModelPoint = readonly [number, number, number]

/** A semantic group that the scene coordinator can position without knowing about GLTF nodes. */
export type WatchModelPart = Readonly<{
  assembled: WatchModelPoint
  content: ReactNode
}>

/** The movement groups exposed to the watch choreography. */
export type WatchModelParts = Readonly<{
  balance: WatchModelPart
  barrel: WatchModelPart
  case: WatchModelPart
  dial: WatchModelPart
  escapement: WatchModelPart
  hands: WatchModelPart
  train: WatchModelPart
}>

type WatchModelNodes = Readonly<{
  balance_wheel: Mesh
  barrel: Mesh
  case: Mesh
  center_wheel: Mesh
  dial: Mesh
  escape_wheel: Mesh
  fourth_wheel: Mesh
  gmt_hand: Mesh
  hour_hand: Mesh
  minute_hand: Mesh
  pallet_fork: Mesh
  third_wheel: Mesh
}>

/** Loads and translates the authored GLB into semantic, choreography-ready watch groups. */
export function WatchModel(props: { children: (parts: WatchModelParts) => ReactNode }) {
  const asset: unknown = useGLTF(watchModelUrl, false, true)
  return props.children(translateWatchModelAsset(asset))
}

/** Starts loading the shared Meshopt-compressed watch asset before the scene mounts. */
export function preloadWatchModel() {
  useGLTF.preload(watchModelUrl, false, true)
}

/** Parses a loaded GLB and translates it into the scene's semantic watch-part contract. */
export function translateWatchModelAsset(asset: unknown): WatchModelParts {
  const nodes = parseWatchModel(asset)

  return {
    balance: createPart(nodes.balance_wheel, [nodes.balance_wheel]),
    barrel: createPart(nodes.barrel, [nodes.barrel]),
    case: createPart(nodes.case, [nodes.case]),
    dial: createPart(nodes.dial, [nodes.dial]),
    escapement: createPart(nodes.escape_wheel, [nodes.escape_wheel, nodes.pallet_fork]),
    hands: createPart(nodes.hour_hand, [nodes.hour_hand, nodes.minute_hand, nodes.gmt_hand]),
    train: createPart(nodes.center_wheel, [nodes.center_wheel, nodes.third_wheel, nodes.fourth_wheel]),
  }
}

function createPart(anchor: Mesh, nodes: readonly Mesh[]): WatchModelPart {
  const assembled = translatePoint(anchor.position.x, anchor.position.y, anchor.position.z)

  return {
    assembled,
    content: (
      <group dispose={null} position={[-assembled[0], -assembled[1], -assembled[2]]}>
        <group dispose={null} rotation={[Math.PI / 2, 0, 0]} scale={watchModelScale}>
          {nodes.map((node) => (
            <Clone key={node.uuid} object={node} />
          ))}
        </group>
      </group>
    ),
  }
}

function translatePoint(x: number, y: number, z: number): WatchModelPoint {
  return [x * watchModelScale, -z * watchModelScale, y * watchModelScale]
}

function parseWatchModel(asset: unknown): WatchModelNodes {
  if (!isRecord(asset) || !isRecord(asset.nodes)) {
    throw new WatchModelAssetError("Expected the watch GLB to provide a named node map.")
  }

  return {
    balance_wheel: readMesh(asset.nodes, "balance_wheel"),
    barrel: readMesh(asset.nodes, "barrel"),
    case: readMesh(asset.nodes, "case"),
    center_wheel: readMesh(asset.nodes, "center_wheel"),
    dial: readMesh(asset.nodes, "dial"),
    escape_wheel: readMesh(asset.nodes, "escape_wheel"),
    fourth_wheel: readMesh(asset.nodes, "fourth_wheel"),
    gmt_hand: readMesh(asset.nodes, "gmt_hand"),
    hour_hand: readMesh(asset.nodes, "hour_hand"),
    minute_hand: readMesh(asset.nodes, "minute_hand"),
    pallet_fork: readMesh(asset.nodes, "pallet_fork"),
    third_wheel: readMesh(asset.nodes, "third_wheel"),
  }
}

function readMesh(nodes: Readonly<Record<string, unknown>>, name: string) {
  const node = nodes[name]
  if (node instanceof Mesh) return node
  throw new WatchModelAssetError(`Expected watch GLB node "${name}" to be a mesh.`)
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null
}

class WatchModelAssetError extends Error {
  readonly _tag = "WatchModelAssetError"

  constructor(message: string) {
    super(message)
    this.name = "WatchModelAssetError"
  }
}
