import { expect, jest, test } from '@jest/globals'

const execFile = jest.fn()
jest.unstable_mockModule('node:child_process', () => ({ execFile }))
const { verifyCpuPerformanceCounters } = await import('../src/verifyCpuPerformanceCounters.ts')

const mockPerfOutput = (stderr: string) => {
  execFile.mockImplementationOnce((_command: unknown, _args: unknown, _options: unknown, callback: any) => {
    callback(null, { stderr })
  })
}

test('probe requires a positive hardware instruction count, even when perf succeeds', async () => {
  for (const output of ['', '<not supported>,,instructions:u,0,,', '0,,instructions:u,100,,', '500,,cycles:u,100,,']) {
    mockPerfOutput(output)
    await expect(verifyCpuPerformanceCounters()).rejects.toThrow('positive hardware instruction count')
  }
  mockPerfOutput('12345,,instructions:u,100,,\n500,,cycles:u,100,,')
  await expect(verifyCpuPerformanceCounters()).resolves.toEqual(
    expect.objectContaining({ available: true, instructions: 12345, cycles: 500 }),
  )
})

test('probe preserves perf errors', async () => {
  execFile.mockImplementationOnce((_command: unknown, _args: unknown, _options: unknown, callback: any) => {
    callback(new Error('No permission to enable instructions:u event'))
  })
  await expect(verifyCpuPerformanceCounters()).rejects.toThrow('No permission')
})
