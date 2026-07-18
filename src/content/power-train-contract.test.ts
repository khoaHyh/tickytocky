import { expect, test } from "vitest"

import { parsePowerTrain } from "./power-train-contract"
import validPowerTrain from "./power-train.json"

test("rejects malformed power-train constants at the JSON boundary", () => {
  const malformed = [
    null,
    { ...validPowerTrain, arborTurnsAtFullWind: true },
    { ...validPowerTrain, reserveSecondsAtFullWind: 0 },
    { ...validPowerTrain, reserveSecondsAtFullWind: Number.MAX_SAFE_INTEGER + 1 },
    {
      ...validPowerTrain,
      meshes: {
        ...validPowerTrain.meshes,
        barrelToCenter: { pinionLeaves: 12, wheelTeeth: 96.5 },
      },
    },
    {
      ...validPowerTrain,
      meshes: { ...validPowerTrain.meshes, centerToThird: [] },
    },
  ]

  for (const value of malformed) expect(() => parsePowerTrain(value)).toThrow("Power-train constant")
})
