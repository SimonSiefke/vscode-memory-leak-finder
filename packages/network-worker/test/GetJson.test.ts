import { test, expect, jest, beforeEach } from '@jest/globals'

const mockFetch = jest.fn()

jest.unstable_mockModule('node:http', () => ({}))
jest.unstable_mockModule('node:https', () => ({}))

// @ts-ignore
globalThis.fetch = mockFetch

const { getJson } = await import('../src/parts/GetJson/GetJson.ts')

beforeEach(() => {
  jest.clearAllMocks()
})

test('getJson fetches and returns JSON data', async () => {
  const mockData = { name: 'test', value: 123 }
  const mockResponse = {
    // @ts-ignore
    json: jest.fn().mockResolvedValue(mockData),
    ok: true,
  }
  // @ts-ignore
  mockFetch.mockResolvedValue(mockResponse)

  const result = await getJson('https://example.com/api/data')

  expect(mockFetch).toHaveBeenCalledWith('https://example.com/api/data', {
    signal: expect.any(AbortSignal),
  })
  expect(result).toEqual(mockData)
})

test('getJson throws error when response is not ok', async () => {
  const mockResponse = {
    ok: false,
    status: 404,
    statusText: 'Not Found',
  }
  // @ts-ignore
  mockFetch.mockResolvedValue(mockResponse)

  await expect(getJson('https://example.com/api/data')).rejects.toThrow('HTTP 404: Not Found')
})

test('getJson handles timeout', async () => {
  // @ts-ignore
  mockFetch.mockRejectedValue(new Error('The operation was aborted'))

  await expect(getJson('https://example.com/api/data')).rejects.toThrow()
})
