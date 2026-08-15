import { beforeEach, expect, jest, test } from '@jest/globals'

const mockForceGarbageCollection = jest.fn<(...args: any[]) => Promise<void>>()
const mockGetSymbolsWithStackTraces = jest.fn<(...args: any[]) => Promise<any>>()
const mockReleaseObjectGroup = jest.fn<(...args: any[]) => Promise<void>>()
const mockStartTrackingSymbolStackTraces = jest.fn<(...args: any[]) => Promise<void>>()
const mockStopTrackingSymbolStackTraces = jest.fn<(...args: any[]) => Promise<void>>()

jest.unstable_mockModule('../src/parts/ForceGarbageCollection/ForceGarbageCollection.ts', () => ({
  forceGarbageCollection: mockForceGarbageCollection,
}))
jest.unstable_mockModule('../src/parts/GetSymbolsWithStackTraces/GetSymbolsWithStackTraces.ts', () => ({
  getSymbolsWithStackTraces: mockGetSymbolsWithStackTraces,
}))
jest.unstable_mockModule('../src/parts/ReleaseObjectGroup/ReleaseObjectGroup.ts', () => ({
  releaseObjectGroup: mockReleaseObjectGroup,
}))
jest.unstable_mockModule('../src/parts/StartTrackingSymbolStackTraces/StartTrackingSymbolStackTraces.ts', () => ({
  startTrackingSymbolStackTraces: mockStartTrackingSymbolStackTraces,
}))
jest.unstable_mockModule('../src/parts/StopTrackingSymbolStackTraces/StopTrackingSymbolStackTraces.ts', () => ({
  stopTrackingSymbolStackTraces: mockStopTrackingSymbolStackTraces,
}))

const MeasureSymbolsWithStackTraces = await import('../src/parts/MeasureSymbolsWithStackTraces/MeasureSymbolsWithStackTraces.ts')

beforeEach(() => {
  jest.clearAllMocks()
  mockForceGarbageCollection.mockResolvedValue()
  mockGetSymbolsWithStackTraces.mockResolvedValue([{ description: 'leaked' }])
  mockReleaseObjectGroup.mockResolvedValue()
  mockStartTrackingSymbolStackTraces.mockResolvedValue()
  mockStopTrackingSymbolStackTraces.mockResolvedValue()
})

test('collects live symbols after garbage collection and restores Symbol', async () => {
  const session = {}

  await expect(MeasureSymbolsWithStackTraces.start(session as any, 'symbols')).resolves.toEqual([])
  await expect(MeasureSymbolsWithStackTraces.stop(session as any, 'symbols')).resolves.toEqual([{ description: 'leaked' }])

  expect(mockForceGarbageCollection).toHaveBeenCalledTimes(2)
  expect(mockStartTrackingSymbolStackTraces).toHaveBeenCalledWith(session, 'symbols')
  expect(mockGetSymbolsWithStackTraces).toHaveBeenCalledWith(session, 'symbols')
  expect(mockStopTrackingSymbolStackTraces).toHaveBeenCalledWith(session, 'symbols')
})

test('restores Symbol when collecting results fails', async () => {
  mockGetSymbolsWithStackTraces.mockRejectedValue(new Error('connection closed'))

  await expect(MeasureSymbolsWithStackTraces.stop({} as any, 'symbols')).rejects.toThrow('connection closed')
  expect(mockStopTrackingSymbolStackTraces).toHaveBeenCalledTimes(1)
})

test('release restores Symbol and releases the remote object group', async () => {
  const session = {}

  await MeasureSymbolsWithStackTraces.releaseResources(session as any, 'symbols')

  expect(mockStopTrackingSymbolStackTraces).toHaveBeenCalledWith(session, 'symbols')
  expect(mockReleaseObjectGroup).toHaveBeenCalledWith(session, 'symbols')
})
