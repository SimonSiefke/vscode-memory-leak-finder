import { expect, jest, test } from '@jest/globals'

const evaluate = jest.fn<(_session: unknown, options: { readonly expression: string }) => Promise<undefined>>(async () => undefined)

jest.unstable_mockModule('../src/parts/DevtoolsProtocol/DevtoolsProtocol.ts', () => ({
  DevtoolsProtocolRuntime: { evaluate },
}))

const AsyncResourceTracker = await import('../src/parts/AsyncResourceTracker/AsyncResourceTracker.ts')

test('injects syntactically valid JavaScript', async () => {
  await AsyncResourceTracker.start({} as any)
  const call = evaluate.mock.calls[0]
  if (!call) {
    throw new Error('Expected DevtoolsProtocolRuntime.evaluate to be called')
  }
  const expression = call[1].expression
  expect(() => new Function(expression)).not.toThrow()
})
