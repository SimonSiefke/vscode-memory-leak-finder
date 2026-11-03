import { expect, jest, test } from '@jest/globals'
import { prepareWorkspaceWatcher } from '../src/parts/WorkspaceReadiness/WorkspaceReadiness.ts'

test('setup waits for a watcher-delivered update after the initial snapshot and removes its files', async () => {
  const files = new Set<string>()
  const visible = new Set<string>()
  const watched = Promise.withResolvers<void>()
  const events: string[] = []
  const api = {
    Workspace: {
      add: async ({ name }: { name: string; content: string }) => {
        files.add(name)
        events.push('add')
      },
      remove: async (name: string) => {
        files.delete(name)
        visible.delete(name)
        events.push('remove')
      },
    },
    Explorer: {
      focus: async () => {},
      refresh: jest.fn(async () => {
        for (const file of files) visible.add(file)
      }),
      shouldHaveItem: async (name: string) => {
        if (!visible.has(name)) {
          events.push('wait-watcher')
          await watched.promise
          visible.add(name)
        }
      },
      not: {
        toHaveItem: async (name: string) => {
          expect(visible.has(name)).toBe(false)
        },
      },
    },
  }
  let ready = false
  const pending = prepareWorkspaceWatcher(api).then(() => {
    ready = true
  })
  for (let i = 0; i < 20 && !events.includes('wait-watcher'); i++) await Promise.resolve()
  expect(events).toContain('wait-watcher')
  expect(ready).toBe(false)
  expect(files.size).toBe(2)
  watched.resolve()
  await pending
  expect(api.Explorer.refresh).toHaveBeenCalledTimes(1)
  expect(files.size).toBe(0)
  expect(visible.size).toBe(0)
})

test('a failed watcher readiness check cleans its files and fails without retrying the scenario', async () => {
  const files = new Set<string>()
  const api = {
    Workspace: {
      add: async ({ name }: { name: string; content: string }) => {
        files.add(name)
      },
      remove: async (name: string) => {
        files.delete(name)
      },
    },
    Explorer: {
      focus: async () => {},
      refresh: async () => {},
      shouldHaveItem: async () => {
        throw new Error('watcher not ready')
      },
      not: { toHaveItem: async () => {} },
    },
  }
  await expect(prepareWorkspaceWatcher(api)).rejects.toThrow('watcher not ready')
  expect(files.size).toBe(0)
})
