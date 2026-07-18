import { expect, jest, test } from '@jest/globals'
import { runMemoryCityComparisons } from '../src/parts/RunMemoryCityComparisons/RunMemoryCityComparisons.ts'

test('runMemoryCityComparisons - analyzes both owners sequentially', async () => {
  const events: string[] = []
  await runMemoryCityComparisons(
    jest.fn(async () => {
      events.push('renderer')
    }),
    jest.fn(async () => {
      events.push('extension-host')
    }),
  )
  expect(events).toEqual(['renderer', 'extension-host'])
})

test('runMemoryCityComparisons - still cleans up extension host after renderer failure', async () => {
  const rendererError = new Error('renderer failed')
  const extensionHost = jest.fn(async () => undefined)
  await expect(
    runMemoryCityComparisons(async () => {
      throw rendererError
    }, extensionHost),
  ).rejects.toBe(rendererError)
  expect(extensionHost).toHaveBeenCalledTimes(1)
})

test('runMemoryCityComparisons - reports extension host failure', async () => {
  const extensionHostError = new Error('extension host failed')
  await expect(
    runMemoryCityComparisons(
      async () => undefined,
      async () => {
        throw extensionHostError
      },
    ),
  ).rejects.toBe(extensionHostError)
})
