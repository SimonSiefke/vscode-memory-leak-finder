import { expect, test } from '@jest/globals'
import { createGetSshRemoteServerRootPid } from '../src/parts/GetSshRemoteServerRootPid/GetSshRemoteServerRootPid.ts'

test('getSshRemoteServerRootPid - prefers shell bootstrap process when available', async () => {
  const getSshRemoteServerRootPid = createGetSshRemoteServerRootPid({
    getPlatform: () => 'linux',
    listProcessIds: async () => [101, 220, 330],
    readCommandLine: async (pid: number) => {
      switch (pid) {
        case 101:
          return '/usr/bin/bash /home/user/.vscode-server/bin/code-server.sh --start-server'
        case 220:
          return '/home/user/.vscode-server/cli/servers/Stable-123/server/node /home/user/.vscode-server/cli/servers/Stable-123/server/out/server-main.js'
        default:
          return '/usr/bin/sleep 1'
      }
    },
  })

  const result = await getSshRemoteServerRootPid()

  expect(result).toBe(101)
})

test('getSshRemoteServerRootPid - falls back to server node process when shell is gone', async () => {
  const getSshRemoteServerRootPid = createGetSshRemoteServerRootPid({
    getPlatform: () => 'linux',
    listProcessIds: async () => [220, 330],
    readCommandLine: async (pid: number) => {
      switch (pid) {
        case 220:
          return '/home/user/.vscode-server/cli/servers/Stable-123/server/node /home/user/.vscode-server/cli/servers/Stable-123/server/out/server-main.js'
        default:
          return '/usr/bin/sleep 1'
      }
    },
  })

  const result = await getSshRemoteServerRootPid()

  expect(result).toBe(220)
})

test('getSshRemoteServerRootPid - returns undefined on non-linux platforms', async () => {
  const getSshRemoteServerRootPid = createGetSshRemoteServerRootPid({
    getPlatform: () => 'darwin',
    listProcessIds: async () => [101],
    readCommandLine: async () => '/usr/bin/bash /home/user/.vscode-server/bin/code-server.sh --start-server',
  })

  const result = await getSshRemoteServerRootPid()

  expect(result).toBeUndefined()
})

test('getSshRemoteServerRootPid - ignores unreadable processes', async () => {
  const getSshRemoteServerRootPid = createGetSshRemoteServerRootPid({
    getPlatform: () => 'linux',
    listProcessIds: async () => [101, 220],
    readCommandLine: async (pid: number) => {
      if (pid === 101) {
        throw new Error('ENOENT')
      }
      return '/home/user/.vscode-server/cli/servers/Stable-123/server/node /home/user/.vscode-server/cli/servers/Stable-123/server/out/server-main.js'
    },
  })

  const result = await getSshRemoteServerRootPid()

  expect(result).toBe(220)
})
