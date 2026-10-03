import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'

const mockEvaluate = jest.fn<(...args: any[]) => Promise<any>>()

jest.unstable_mockModule('../src/parts/DevtoolsProtocol/DevtoolsProtocol.ts', () => ({
  DevtoolsProtocolRuntime: {
    evaluate: mockEvaluate,
  },
}))

const GetSymbolsWithStackTraces = await import('../src/parts/GetSymbolsWithStackTraces/GetSymbolsWithStackTraces.ts')
const StartTrackingSymbolStackTraces = await import('../src/parts/StartTrackingSymbolStackTraces/StartTrackingSymbolStackTraces.ts')
const StopTrackingSymbolStackTraces = await import('../src/parts/StopTrackingSymbolStackTraces/StopTrackingSymbolStackTraces.ts')

const originalSymbol = globalThis.Symbol

beforeEach(() => {
  jest.clearAllMocks()
  mockEvaluate.mockImplementation(async (_session, options) => Function(`return ${options.expression}`)())
})

afterEach(() => {
  globalThis.Symbol = originalSymbol
  delete (globalThis as any).___originalSymbol
  delete (globalThis as any).___symbolStackTraceRecords
  delete (globalThis as any).___trackedSymbol
})

test('records live symbols without retaining ordinary symbols itself', async () => {
  await StartTrackingSymbolStackTraces.startTrackingSymbolStackTraces({} as any, 'symbols')

  const createLeakedSymbol = () => Symbol('leaked')
  const retainedSymbol = createLeakedSymbol()
  const results = await GetSymbolsWithStackTraces.getSymbolsWithStackTraces({} as any, 'symbols')
  const leaked = results.find((result) => result.description === 'leaked')

  expect(retainedSymbol.description).toBe('leaked')
  expect(leaked).toMatchObject({
    description: 'leaked',
    name: 'Symbol(leaked)',
    registered: false,
  })
  expect(leaked?.stackTrace).toContain('createLeakedSymbol')

  await StopTrackingSymbolStackTraces.stopTrackingSymbolStackTraces({} as any, 'symbols')
  expect(globalThis.Symbol).toBe(originalSymbol)
})

test('preserves Symbol static properties and records a registry symbol only once', async () => {
  await StartTrackingSymbolStackTraces.startTrackingSymbolStackTraces({} as any, 'symbols')

  expect(Symbol.iterator).toBe(originalSymbol.iterator)
  const first = Symbol.for('tracked-registry-symbol')
  const second = Symbol.for('tracked-registry-symbol')
  const results = await GetSymbolsWithStackTraces.getSymbolsWithStackTraces({} as any, 'symbols')
  const registered = results.filter((result) => result.description === 'tracked-registry-symbol')

  expect(first).toBe(second)
  expect(registered).toHaveLength(1)
  expect(registered[0].registered).toBe(true)
})
