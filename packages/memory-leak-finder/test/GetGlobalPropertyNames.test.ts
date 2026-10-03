import { beforeEach, expect, jest, test } from '@jest/globals'

const mockEvaluate = jest.fn<(...args: any[]) => Promise<readonly string[]>>()

jest.unstable_mockModule('../src/parts/DevtoolsProtocol/DevtoolsProtocol.ts', () => ({
  DevtoolsProtocolRuntime: {
    evaluate: mockEvaluate,
  },
}))

const GetGlobalPropertyNames = await import('../src/parts/GetGlobalPropertyNames/GetGlobalPropertyNames.ts')

beforeEach(() => {
  jest.clearAllMocks()
  mockEvaluate.mockResolvedValue(['document', 'window'])
})

test('gets sorted own string-named properties from globalThis', async () => {
  const session = {}

  await expect(GetGlobalPropertyNames.getGlobalPropertyNames(session as any)).resolves.toEqual(['document', 'window'])
  expect(mockEvaluate).toHaveBeenCalledWith(session, {
    expression: 'Object.getOwnPropertyNames(globalThis).sort()',
    returnByValue: true,
  })
})
