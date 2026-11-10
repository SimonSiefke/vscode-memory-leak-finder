import { beforeEach, expect, jest, test } from '@jest/globals'

const invoke = jest.fn<(...args: unknown[]) => Promise<object>>()
const dispose = jest.fn(async () => {})
const create = jest.fn(async () => ({ invoke, dispose }))
jest.unstable_mockModule('@lvce-editor/rpc', () => ({ NodeWorkerRpcParent: { create } }))
const { createSourceMapLoader } = await import('../src/parts/LoadSourceMap/LoadSourceMap.ts')

beforeEach(() => {
  invoke.mockReset()
  dispose.mockClear()
  create.mockClear()
})

test('reuses one worker for a batch and disposes it afterwards', async () => {
  const sourceMap = { mappings: '', sources: [], version: 3 }
  invoke.mockResolvedValue(sourceMap)
  {
    await using loader = await createSourceMapLoader()
    expect(await loader.loadSourceMap('first.map', 'first-hash')).toBe(sourceMap)
    expect(await loader.loadSourceMap('second.map', 'second-hash')).toBe(sourceMap)
  }
  expect(create).toHaveBeenCalledTimes(1)
  expect(invoke.mock.calls).toEqual([
    ['LoadSourceMap.loadSourceMap', 'first.map', 'first-hash'],
    ['LoadSourceMap.loadSourceMap', 'second.map', 'second-hash'],
  ])
  expect(dispose).toHaveBeenCalledTimes(1)
})

test('preserves per-file errors and can load another map after a failure', async () => {
  const sourceMap = { mappings: '', sources: [], version: 3 }
  invoke.mockRejectedValueOnce(new Error('invalid map')).mockResolvedValueOnce(sourceMap)
  {
    await using loader = await createSourceMapLoader()
    await expect(loader.loadSourceMap('bad.map', 'bad-hash')).rejects.toThrow('Failed to load source map for bad.map')
    expect(await loader.loadSourceMap('good.map', 'good-hash')).toBe(sourceMap)
  }
  expect(create).toHaveBeenCalledTimes(1)
  expect(dispose).toHaveBeenCalledTimes(1)
})
