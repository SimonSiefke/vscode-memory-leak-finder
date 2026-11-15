import { beforeEach, expect, jest, test } from '@jest/globals'

const inspectChildProcess = jest.fn<(rootPid: number, name: string) => Promise<{ pid: number; inspectPort: number } | undefined>>()
const getRuntimeInfo = jest.fn<() => unknown>()
jest.unstable_mockModule('../src/parts/InspectChildProcess/InspectChildProcess.ts', () => ({ inspectChildProcess }))
jest.unstable_mockModule('../src/parts/PageObjectState/PageObjectState.ts', () => ({
  getPageObject: () => ({ ExternalRuntime: { getRuntimeInfo } }),
}))

const { getExternalRuntimeInfo } = await import('../src/parts/GetExternalRuntimeInfo/GetExternalRuntimeInfo.ts')

beforeEach(() => {
  jest.resetAllMocks()
})

test('uses the verified child process without requiring a test-launched runtime', async () => {
  const info = { pid: 123, inspectPort: 9229 }
  inspectChildProcess.mockResolvedValue(info)
  expect(await getExternalRuntimeInfo(1, 'jsonServerMain', 100)).toBe(info)
  expect(inspectChildProcess).toHaveBeenCalledWith(100, 'jsonServerMain')
  expect(getRuntimeInfo).not.toHaveBeenCalled()
})

test('preserves support for test-launched runtimes', async () => {
  inspectChildProcess.mockResolvedValue(undefined)
  const info = { pid: 456, inspectPort: 9230 }
  getRuntimeInfo.mockReturnValue(info)
  expect(await getExternalRuntimeInfo(1, 'server.js', 100)).toBe(info)
})

test('does not silently fall back after inspector verification fails', async () => {
  inspectChildProcess.mockRejectedValue(new Error('Wrong PID'))
  await expect(getExternalRuntimeInfo(1, 'jsonServerMain', 100)).rejects.toThrow('Wrong PID')
  expect(getRuntimeInfo).not.toHaveBeenCalled()
})
