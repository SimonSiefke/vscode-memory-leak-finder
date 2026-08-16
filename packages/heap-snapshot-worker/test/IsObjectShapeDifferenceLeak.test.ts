import { expect, test } from '@jest/globals'
import type { ObjectShapeDifference } from '../src/parts/CompareObjectShapeDifference/CompareObjectShapeDifference.ts'
import { isObjectShapeDifferenceLeak } from '../src/parts/IsObjectShapeDifferenceLeak/IsObjectShapeDifferenceLeak.ts'

const createDifference = (instanceCount: number, shapeCount: number): ObjectShapeDifference => ({
  after: { instanceCount, shapeCount },
  before: { instanceCount: 0, shapeCount: 0 },
  constructorName: 'Object',
  delta: { instanceCount, shapeCount },
  elementsKind: 'HOLEY_ELEMENTS',
  properties: [],
  prototypeName: 'Object',
})

test('detects live instance growth at the run threshold', () => {
  expect(isObjectShapeDifferenceLeak([createDifference(10, 0)], 10)).toBe(true)
})

test('detects shape growth at the run threshold', () => {
  expect(isObjectShapeDifferenceLeak([createDifference(0, 10)], 10)).toBe(true)
})

test('ignores differences below the run threshold', () => {
  expect(isObjectShapeDifferenceLeak([createDifference(9, 9)], 10)).toBe(false)
})
