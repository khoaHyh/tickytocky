/// <reference types="node" />

import { readFile } from "node:fs/promises"

import { Box3, Mesh, Vector3 } from "three"
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { describe, expect, test } from "vitest"

import { translateWatchModelAsset } from "./watch-model"

const modelPath = new URL("../../public/models/watch-model.glb", import.meta.url)
const goingTrainPairs = [
  ["barrel", "center_pinion"],
  ["center_wheel", "third_pinion"],
  ["third_wheel", "fourth_pinion"],
  ["fourth_wheel", "escape_pinion"],
] as const

describe("watch model asset", () => {
  test("loads the Meshopt GLB through the semantic adapter", async () => {
    const bytes = await readFile(modelPath)
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    const asset = await loader.parseAsync(new Uint8Array(bytes).buffer, "")
    const nodes: Record<string, unknown> = {}

    asset.scene.traverse((node) => {
      if (node.name !== "") nodes[node.name] = node
    })

    const model = translateWatchModelAsset({ nodes })

    expect(Object.keys(model)).toEqual(["balance", "barrel", "case", "dial", "escapement", "hands", "train"])
    expect(model.case.assembled[0]).toBeCloseTo(0)
    expect(model.case.assembled[1]).toBeCloseTo(0)
    expect(model.case.assembled[2]).toBeCloseTo(0.24)
    expect(Object.values(model).every((part) => part.assembled.every(Number.isFinite))).toBe(true)
  })

  test("rejects an asset that omits a required semantic node", async () => {
    const bytes = await readFile(modelPath)
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    const asset = await loader.parseAsync(new Uint8Array(bytes).buffer, "")
    const nodes: Record<string, unknown> = {}

    asset.scene.traverse((node) => {
      if (node.name !== "" && node.name !== "pallet_fork") nodes[node.name] = node
    })

    expect(() => translateWatchModelAsset({ nodes })).toThrow('Expected watch GLB node "pallet_fork" to be a mesh.')
  })

  test("keeps each going-train wheel engaged with the next pinion", async () => {
    const bytes = await readFile(modelPath)
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    const asset = await loader.parseAsync(new Uint8Array(bytes).buffer, "")
    asset.scene.updateMatrixWorld(true)

    for (const [wheelName, pinionName] of goingTrainPairs) {
      const wheel = asset.scene.getObjectByName(wheelName)
      const pinion = asset.scene.getObjectByName(pinionName)
      if (!(wheel instanceof Mesh) || !(pinion instanceof Mesh)) {
        throw new Error(`Expected ${wheelName} and ${pinionName} to be meshes.`)
      }

      const wheelPosition = wheel.getWorldPosition(new Vector3())
      const pinionPosition = pinion.getWorldPosition(new Vector3())
      const centerDistance = Math.hypot(wheelPosition.x - pinionPosition.x, wheelPosition.z - pinionPosition.z)
      const tipRadiusSum = faceRadius(wheel) + faceRadius(pinion)

      expect(centerDistance, `${wheelName} must not overlap ${pinionName} excessively`).toBeGreaterThan(
        tipRadiusSum * 0.9,
      )
      expect(centerDistance, `${wheelName} must reach ${pinionName}`).toBeLessThan(tipRadiusSum)
    }
  })
})

function faceRadius(mesh: Mesh) {
  const size = new Box3().setFromObject(mesh).getSize(new Vector3())
  return Math.max(size.x, size.z) / 2
}
