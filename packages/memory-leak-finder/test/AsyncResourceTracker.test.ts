import { expect, jest, test } from '@jest/globals'

const evaluate = jest.fn(async () => undefined)

jest.unstable_mockModule('../src/parts/DevtoolsProtocol/DevtoolsProtocol.ts', () => ({
  DevtoolsProtocolRuntime: { evaluate },
}))

const AsyncResourceTracker = await import('../src/parts/AsyncResourceTracker/AsyncResourceTracker.ts')

test('injects syntactically valid JavaScript', async () => {
  await AsyncResourceTracker.start({} as any)
  const expression = evaluate.mock.calls[0][1].expression
  expect(() => new Function(expression)).not.toThrow()
})
