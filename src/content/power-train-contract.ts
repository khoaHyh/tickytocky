import rawPowerTrain from "./power-train.json"

/** One wheel-and-pinion count pair in the illustrative going train. */
export type PowerTrainMesh = Readonly<{
  pinionLeaves: number
  wheelTeeth: number
}>

/** The checked educational constants shared by lesson copy and mechanics. */
export const powerTrain = parsePowerTrain(rawPowerTrain)

/** Parses the shared power-train data and rejects malformed mechanical counts. */
export function parsePowerTrain(value: unknown) {
  const record = parseRecord(value, "power train")
  const meshes = parseRecord(record.meshes, "meshes")
  return {
    arborTurnsAtFullWind: positiveInteger(record.arborTurnsAtFullWind, "arborTurnsAtFullWind"),
    meshes: {
      barrelToCenter: parseMesh(meshes.barrelToCenter, "barrelToCenter"),
      centerToThird: parseMesh(meshes.centerToThird, "centerToThird"),
      fourthToEscape: parseMesh(meshes.fourthToEscape, "fourthToEscape"),
      thirdToFourth: parseMesh(meshes.thirdToFourth, "thirdToFourth"),
    },
    reserveSecondsAtFullWind: positiveInteger(record.reserveSecondsAtFullWind, "reserveSecondsAtFullWind"),
  } as const
}

/** Returns the speed increase across one checked wheel-and-pinion pair. */
export function powerTrainRatio(mesh: PowerTrainMesh) {
  return mesh.wheelTeeth / mesh.pinionLeaves
}

function parseMesh(value: unknown, name: string): PowerTrainMesh {
  const record = parseRecord(value, name)
  return {
    pinionLeaves: positiveInteger(record.pinionLeaves, `${name}.pinionLeaves`),
    wheelTeeth: positiveInteger(record.wheelTeeth, `${name}.wheelTeeth`),
  }
}

function parseRecord(value: unknown, name: string): Readonly<Record<string, unknown>> {
  if (isRecord(value)) return value
  throw new TypeError(`Power-train constant "${name}" must be an object.`)
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function positiveInteger(value: unknown, name: string) {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value
  throw new RangeError(`Power-train constant "${name}" must be a positive integer.`)
}
