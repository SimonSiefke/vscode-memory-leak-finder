import { expect, test } from '@jest/globals'
import { parseGoal } from '../src/Goal.ts'

test('parseGoal parses latency and counter goals', () => {
  expect(parseGoal('latency:-50%')).toEqual({
    metric: 'latencyMs',
    targetRelativeChange: -0.5,
  })
  expect(parseGoal('instructions:-20%')).toEqual({
    metric: 'instructions',
    targetRelativeChange: -0.2,
  })
})

test('parseGoal rejects invalid goals', () => {
  expect(() => parseGoal('latency:50%')).toThrow('Goal must request a reduction')
  expect(() => parseGoal('memory:-10%')).toThrow('Unsupported goal metric')
})
