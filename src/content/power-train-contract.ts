import rawPowerTrain from "./power-train.json"

/** One wheel-and-pinion count pair in the illustrative going train. */
export type PowerTrainMesh = Readonly<{
  pinionLeaves: number
  wheelTeeth: number
}>

/** The checked educational constants shared by lesson copy and mechanics. */
export const powerTrain = {
  arborTurnsAtFullWind: positiveInteger(rawPowerTrain.arborTurnsAtFullWind, "arborTurnsAtFullWind"),
  meshes: {
    barrelToCenter: parseMesh(rawPowerTrain.meshes.barrelToCenter, "barrelToCenter"),
    centerToThird: parseMesh(rawPowerTrain.meshes.centerToThird, "centerToThird"),
    fourthToEscape: parseMesh(rawPowerTrain.meshes.fourthToEscape, "fourthToEscape"),
    thirdToFourth: parseMesh(rawPowerTrain.meshes.thirdToFourth, "thirdToFourth"),
  },
  reserveSecondsAtFullWind: positiveInteger(rawPowerTrain.reserveSecondsAtFullWind, "reserveSecondsAtFullWind"),
} as const

/** Returns the speed increase across one checked wheel-and-pinion pair. */
export function powerTrainRatio(mesh: PowerTrainMesh) {
  return mesh.wheelTeeth / mesh.pinionLeaves
}

function parseMesh(value: PowerTrainMesh, name: string): PowerTrainMesh {
  return {
    pinionLeaves: positiveInteger(value.pinionLeaves, `${name}.pinionLeaves`),
    wheelTeeth: positiveInteger(value.wheelTeeth, `${name}.wheelTeeth`),
  }
}

function positiveInteger(value: number, name: string) {
  if (Number.isInteger(value) && value > 0) return value
  throw new RangeError(`Power-train constant "${name}" must be a positive integer.`)
}
