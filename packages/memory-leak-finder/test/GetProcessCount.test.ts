import { expect, test } from '@jest/globals'
import { createGetProcessCount } from '../src/parts/GetProcessCount/GetProcessCount.ts'

test('getProcessCount - returns 0 when pid is undefined', async () => {
  const getProcessCount = createGetProcessCount({
    getAllDescendantPids: async () => [1],
    getPlatform: () => 'linux',
    resolveProcessRootPid: async () => 1,
  })

  const result = await getProcessCount(undefined, 'launch-pid')

  expect(result).toBe(0)
})

test('getProcessCount - returns 0 on non-linux platforms', async () => {
  const getProcessCount = createGetProcessCount({
    getAllDescendantPids: async () => [1, 2],
    getPlatform: () => 'darwin',
    resolveProcessRootPid: async () => 2,
  })

  const result = await getProcessCount(1, 'launch-pid')

  expect(result).toBe(0)
})

test('getProcessCount - counts root process and descendants from resolved pid', async () => {
  const invocations: string[] = []
  const getProcessCount = createGetProcessCount({
    getAllDescendantPids: async (pid: number) => {
      invocations.push(`descendants:${pid}`)
      return [pid, 21, 22, 23]
    },
    getPlatform: () => 'linux',
    resolveProcessRootPid: async (pid: number | undefined, strategy: string) => {
      invocations.push(`resolve:${pid}:${strategy}`)
      return 20
    },
  })

  const result = await getProcessCount(10, 'ssh-remote-server')

  expect(result).toBe(4)
  expect(invocations).toEqual(['resolve:10:ssh-remote-server', 'descendants:20'])
})

test('getProcessCount - returns 0 when root resolution fails', async () => {
  const getProcessCount = createGetProcessCount({
    getAllDescendantPids: async () => [1, 2],
    getPlatform: () => 'linux',
    resolveProcessRootPid: async () => undefined,
  })

  const result = await getProcessCount(10, 'ssh-remote-server')

  expect(result).toBe(0)
})
