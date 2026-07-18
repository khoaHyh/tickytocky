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

/** One locally animated mechanism element positioned relative to its assembly group. */
export type WatchModelLocalPart = Readonly<{
  content: ReactNode
  offset: WatchModelPoint
}>

/** The separately animated pieces inside the balance assembly group. */
export type WatchModelBalancePart = Readonly<{
  assembled: WatchModelPoint
  hairspring: WatchModelLocalPart
  wheel: WatchModelLocalPart
}>

/** The separately animated pieces inside the mainspring barrel assembly. */
export type WatchModelBarrelPart = Readonly<{
  arbor: WatchModelLocalPart
  assembled: WatchModelPoint
  drum: WatchModelLocalPart
  mainspring: WatchModelLocalPart
}>

/** The separately animated pieces inside the escapement assembly group. */
export type WatchModelEscapementPart = Readonly<{
  assembled: WatchModelPoint
  escapeWheel: WatchModelLocalPart
  palletFork: WatchModelLocalPart
}>

/** The rigid wheel-and-pinion pairs inside the going-train assembly. */
export type WatchModelTrainPart = Readonly<{
  assembled: WatchModelPoint
  centerWheel: WatchModelLocalPart
  fourthWheel: WatchModelLocalPart
  thirdWheel: WatchModelLocalPart
}>

/** The movement groups exposed to the watch choreography. */
export type WatchModelParts = Readonly<{
  balance: WatchModelBalancePart
  barrel: WatchModelBarrelPart
  case: WatchModelPart
  dial: WatchModelPart
  escapement: WatchModelEscapementPart
  hands: WatchModelPart
  train: WatchModelTrainPart
}>

type WatchModelNodes = Readonly<{
  balance_wheel: Mesh
  barrel: Mesh
  barrel_arbor: Mesh
  case: Mesh
  center_pinion: Mesh
  center_wheel: Mesh
  dial: Mesh
  entry_pallet_stone: Mesh
  escape_wheel: Mesh
  escape_pinion: Mesh
  exit_pallet_stone: Mesh
  fourth_wheel: Mesh
  fourth_pinion: Mesh
  gmt_hand: Mesh
  hairspring: Mesh
  hour_hand: Mesh
  impulse_jewel: Mesh
  minute_hand: Mesh
  mainspring: Mesh
  pallet_fork: Mesh
  third_wheel: Mesh
  third_pinion: Mesh
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
    balance: {
      assembled: translateMeshPosition(nodes.balance_wheel),
      hairspring: createLocalPart(nodes.balance_wheel, nodes.balance_wheel, [nodes.hairspring]),
      wheel: createLocalPart(nodes.balance_wheel, nodes.balance_wheel, [nodes.balance_wheel, nodes.impulse_jewel]),
    },
    barrel: {
      arbor: createLocalPart(nodes.barrel, nodes.barrel_arbor, [nodes.barrel_arbor]),
      assembled: translateMeshPosition(nodes.barrel),
      drum: createLocalPart(nodes.barrel, nodes.barrel, [nodes.barrel]),
      mainspring: createLocalPart(nodes.barrel, nodes.mainspring, [nodes.mainspring]),
    },
    case: createPart(nodes.case, [nodes.case]),
    dial: createPart(nodes.dial, [nodes.dial]),
    escapement: {
      assembled: translateMeshPosition(nodes.escape_wheel),
      escapeWheel: createLocalPart(nodes.escape_wheel, nodes.escape_wheel, [nodes.escape_wheel, nodes.escape_pinion]),
      palletFork: createLocalPart(nodes.escape_wheel, nodes.pallet_fork, [
        nodes.pallet_fork,
        nodes.entry_pallet_stone,
        nodes.exit_pallet_stone,
      ]),
    },
    hands: createPart(nodes.hour_hand, [nodes.hour_hand, nodes.minute_hand, nodes.gmt_hand]),
    train: {
      assembled: translateMeshPosition(nodes.center_wheel),
      centerWheel: createLocalPart(nodes.center_wheel, nodes.center_wheel, [nodes.center_wheel, nodes.center_pinion]),
      fourthWheel: createLocalPart(nodes.center_wheel, nodes.fourth_wheel, [nodes.fourth_wheel, nodes.fourth_pinion]),
      thirdWheel: createLocalPart(nodes.center_wheel, nodes.third_wheel, [nodes.third_wheel, nodes.third_pinion]),
    },
  }
}

function createPart(anchor: Mesh, nodes: readonly Mesh[]): WatchModelPart {
  const assembled = translateMeshPosition(anchor)

  return {
    assembled,
    content: createContent(assembled, nodes),
  }
}

function createLocalPart(parentAnchor: Mesh, pivot: Mesh, nodes: readonly Mesh[]): WatchModelLocalPart {
  const parentPosition = translateMeshPosition(parentAnchor)
  const pivotPosition = translateMeshPosition(pivot)
  return {
    content: createContent(pivotPosition, nodes),
    offset: [
      pivotPosition[0] - parentPosition[0],
      pivotPosition[1] - parentPosition[1],
      pivotPosition[2] - parentPosition[2],
    ],
  }
}

function createContent(anchor: WatchModelPoint, nodes: readonly Mesh[]) {
  return (
    <group dispose={null} position={[-anchor[0], -anchor[1], -anchor[2]]}>
      <group dispose={null} rotation={[Math.PI / 2, 0, 0]} scale={watchModelScale}>
        {nodes.map((node) => (
          <Clone key={node.uuid} object={node} />
        ))}
      </group>
    </group>
  )
}

function translateMeshPosition(mesh: Mesh): WatchModelPoint {
  return translatePoint(mesh.position.x, mesh.position.y, mesh.position.z)
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
    barrel_arbor: readMesh(asset.nodes, "barrel_arbor"),
    case: readMesh(asset.nodes, "case"),
    center_pinion: readMesh(asset.nodes, "center_pinion"),
    center_wheel: readMesh(asset.nodes, "center_wheel"),
    dial: readMesh(asset.nodes, "dial"),
    entry_pallet_stone: readMesh(asset.nodes, "entry_pallet_stone"),
    escape_wheel: readMesh(asset.nodes, "escape_wheel"),
    escape_pinion: readMesh(asset.nodes, "escape_pinion"),
    exit_pallet_stone: readMesh(asset.nodes, "exit_pallet_stone"),
    fourth_wheel: readMesh(asset.nodes, "fourth_wheel"),
    fourth_pinion: readMesh(asset.nodes, "fourth_pinion"),
    gmt_hand: readMesh(asset.nodes, "gmt_hand"),
    hairspring: readMesh(asset.nodes, "hairspring"),
    hour_hand: readMesh(asset.nodes, "hour_hand"),
    impulse_jewel: readMesh(asset.nodes, "impulse_jewel"),
    mainspring: readMesh(asset.nodes, "mainspring"),
    minute_hand: readMesh(asset.nodes, "minute_hand"),
    pallet_fork: readMesh(asset.nodes, "pallet_fork"),
    third_wheel: readMesh(asset.nodes, "third_wheel"),
    third_pinion: readMesh(asset.nodes, "third_pinion"),
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
