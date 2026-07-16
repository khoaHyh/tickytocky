/// <reference types="node" />

import { readFile } from "node:fs/promises"

import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { describe, expect, test } from "vitest"

import { translateWatchModelAsset } from "./watch-model"

const modelPath = new URL("../../public/models/watch-model.glb", import.meta.url)

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
})
