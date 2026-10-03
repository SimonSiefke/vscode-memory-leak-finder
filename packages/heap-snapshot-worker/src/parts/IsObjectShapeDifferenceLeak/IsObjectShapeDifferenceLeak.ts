import type { ObjectShapeDifference } from '../CompareObjectShapeDifference/CompareObjectShapeDifference.ts'

export const isObjectShapeDifferenceLeak = (differences: readonly ObjectShapeDifference[], minimumCount: number): boolean => {
  return differences.some((difference) => difference.delta.shapeCount >= minimumCount || difference.delta.instanceCount >= minimumCount)
}
