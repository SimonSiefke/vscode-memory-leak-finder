import { expect, jest, test } from '@jest/globals'
import * as MeasureCombined from '../src/parts/MeasureCombined/MeasureCombined.ts'
import * as WrapMeasure from '../src/parts/WrapMeasure/WrapMeasure.ts'

test('MeasureCombined forwards runCompletion to measures that implement it', async () => {
  const firstRunCompletion = jest.fn<() => Promise<void>>().mockResolvedValue()
  const secondRunCompletion = jest.fn<() => Promise<void>>().mockResolvedValue()
  const combined = MeasureCombined.combine(
    {
      compare: jest.fn(),
      id: 'first',
      releaseResources: jest.fn(),
      runCompletion: firstRunCompletion,
      start: jest.fn(),
      stop: jest.fn(),
    },
    {
      compare: jest.fn(),
      id: 'second',
      releaseResources: jest.fn(),
      runCompletion: secondRunCompletion,
      start: jest.fn(),
      stop: jest.fn(),
    },
  )

  await combined.runCompletion()

  expect(firstRunCompletion).toHaveBeenCalledTimes(1)
  expect(secondRunCompletion).toHaveBeenCalledTimes(1)
})

test('WrapMeasure forwards runCompletion with created args', async () => {
  const runCompletion = jest.fn<(...args: readonly unknown[]) => Promise<void>>().mockResolvedValue()
  const measure = WrapMeasure.wrapMeasure({
    compare: jest.fn(),
    create: jest.fn(() => ['session-arg']),
    id: 'wrapped',
    runCompletion,
    start: jest.fn(),
    stop: jest.fn(),
  })

  const instance = measure.create({} as any)
  await instance.runCompletion()

  expect(runCompletion).toHaveBeenCalledWith('session-arg')
})
