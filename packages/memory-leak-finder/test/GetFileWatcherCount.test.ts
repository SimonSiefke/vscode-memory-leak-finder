import { expect, test } from '@jest/globals'
import { createGetFileWatcherCount } from '../src/parts/GetFileWatcherCount/GetFileWatcherCount.ts'

test('getFileWatcherCount - returns 0 when pid is undefined', async () => {
  const getFileWatcherCount = createGetFileWatcherCount({
    countInotifyWatchers: async () => 1,
    getAllDescendantPids: async () => [1],
    getPlatform: () => 'linux',
    resolveProcessRootPid: async () => 1,
  })

  const result = await getFileWatcherCount(undefined, 'launch-pid')

  expect(result).toBe(0)
})

test('getFileWatcherCount - returns 0 on non-linux platforms', async () => {
  const getFileWatcherCount = createGetFileWatcherCount({
    countInotifyWatchers: async () => 2,
    getAllDescendantPids: async () => [1, 2],
    getPlatform: () => 'darwin',
    resolveProcessRootPid: async () => 2,
  })

  const result = await getFileWatcherCount(1, 'launch-pid')

  expect(result).toBe(0)
})

test('getFileWatcherCount - counts watchers from resolved ssh root pid and descendants', async () => {
  const invocations: string[] = []
  const watcherCounts = new Map<number, number>([
    [20, 3],
    [21, 5],
    [22, 7],
  ])
  const getFileWatcherCount = createGetFileWatcherCount({
    countInotifyWatchers: async (pid: number) => {
      invocations.push(`count:${pid}`)
      return watcherCounts.get(pid) || 0
    },
    getAllDescendantPids: async (pid: number) => {
      invocations.push(`descendants:${pid}`)
      return [pid, 21, 22]
    },
    getPlatform: () => 'linux',
    resolveProcessRootPid: async (pid: number | undefined, strategy: string) => {
      invocations.push(`resolve:${pid}:${strategy}`)
      return 20
    },
  })

  const result = await getFileWatcherCount(10, 'ssh-remote-server')

  expect(result).toBe(15)
  expect(invocations).toEqual(['resolve:10:ssh-remote-server', 'descendants:20', 'count:20', 'count:21', 'count:22'])
})

test('getFileWatcherCount - returns 0 when root resolution fails', async () => {
  const invocations: string[] = []
  const getFileWatcherCount = createGetFileWatcherCount({
    countInotifyWatchers: async (pid: number) => {
      invocations.push(`count:${pid}`)
      return 1
    },
    getAllDescendantPids: async (pid: number) => {
      invocations.push(`descendants:${pid}`)
      return [pid]
    },
    getPlatform: () => 'linux',
    resolveProcessRootPid: async (pid: number | undefined, strategy: string) => {
      invocations.push(`resolve:${pid}:${strategy}`)
      return undefined
    },
  })

  const result = await getFileWatcherCount(10, 'ssh-remote-server')

  expect(result).toBe(0)
  expect(invocations).toEqual(['resolve:10:ssh-remote-server'])
})
