import { getObjectShapes, type ObjectShape } from '../GetObjectShapes/GetObjectShapes.ts'
import { isObjectShapeDifferenceLeak } from '../IsObjectShapeDifferenceLeak/IsObjectShapeDifferenceLeak.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

interface ShapeCounts {
  readonly instanceCount: number
  readonly shapeCount: number
}

export interface ObjectShapeDifference {
  readonly after: ShapeCounts
  readonly before: ShapeCounts
  readonly constructorName: string
  readonly delta: ShapeCounts
  readonly elementsKind: string
  readonly properties: readonly string[]
  readonly prototypeName: string
}

export interface ObjectShapeDifferenceReport {
  readonly differences: readonly ObjectShapeDifference[]
  readonly isLeak: boolean
}

const emptyCounts: ShapeCounts = { instanceCount: 0, shapeCount: 0 }
const counts = (shape: ObjectShape | undefined): ShapeCounts =>
  shape ? { instanceCount: shape.instanceCount, shapeCount: shape.shapeCount } : emptyCounts

export const compareObjectShapeDifference = async (
  beforePath: string,
  afterPath: string,
  minimumCount = 1,
): Promise<ObjectShapeDifferenceReport> => {
  const [beforeSnapshot, afterSnapshot] = await Promise.all([
    prepareHeapSnapshot(beforePath, { parseStrings: true }),
    prepareHeapSnapshot(afterPath, { parseStrings: true }),
  ])
  const beforeShapes = new Map(getObjectShapes(beforeSnapshot).map((shape) => [shape.signature, shape]))
  const afterShapes = new Map(getObjectShapes(afterSnapshot).map((shape) => [shape.signature, shape]))
  const signatures = new Set([...beforeShapes.keys(), ...afterShapes.keys()])
  const differences = [...signatures]
    .map((signature): ObjectShapeDifference => {
      const beforeShape = beforeShapes.get(signature)
      const afterShape = afterShapes.get(signature)
      const shape = afterShape || beforeShape!
      const before = counts(beforeShape)
      const after = counts(afterShape)
      return {
        after,
        before,
        constructorName: shape.constructorName,
        delta: { instanceCount: after.instanceCount - before.instanceCount, shapeCount: after.shapeCount - before.shapeCount },
        elementsKind: shape.elementsKind,
        properties: shape.properties,
        prototypeName: shape.prototypeName,
      }
    })
    .filter((item) => item.delta.shapeCount !== 0 || item.delta.instanceCount !== 0)
    .sort((a, b) => b.delta.shapeCount - a.delta.shapeCount || b.delta.instanceCount - a.delta.instanceCount)
  return { differences, isLeak: isObjectShapeDifferenceLeak(differences, minimumCount) }
}
