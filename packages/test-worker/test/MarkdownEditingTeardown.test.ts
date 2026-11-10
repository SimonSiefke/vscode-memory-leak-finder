import { expect, jest, test } from '@jest/globals'

const { teardown } = await import(new URL('../../e2e/helpers/markdownEditing.ts', import.meta.url).href)

test.each([false, true])(
  'Markdown teardown closes Git before removing its repository (initially enabled: %s)',
  async (initiallyEnabled) => {
    let enabled = initiallyEnabled
    let repositories = enabled ? 1 : 0
    let closed = false
    const remove = jest.fn(async (name: string) => {
      if (name === '.vscode/settings.json') enabled = true
      if (name === '.git') {
        // Removing a repository while Git is active can discover the enclosing
        // harness checkout. Wait for the configuration change to close its model.
        expect(enabled).toBe(false)
        expect(closed).toBe(true)
      }
    })
    const context = {
      Editor: { closeAll: jest.fn(async () => {}) },
      Git: {
        openRepository: jest.fn(async () => {
          repositories = 1
        }),
        closeRepository: jest.fn(async () => {
          repositories = 0
        }),
      },
      QuickPick: { executeCommand: jest.fn(async () => {}), waitForCommand: jest.fn(async () => {}) },
      SourceControl: {
        shouldHaveRepositoryCount: jest.fn(async (count: number) => {
          // The settings write itself does not synchronously apply in VS Code.
          if (!enabled) repositories = 0
          expect(repositories).toBe(count)
          closed = count === 0
        }),
      },
      Workspace: {
        remove,
        updateWorkspaceSettings: jest.fn(async (settings: Record<string, unknown>) => {
          enabled = settings['git.enabled'] as boolean
        }),
      },
    }
    await teardown(context)
    expect(remove).toHaveBeenCalledWith('.git')
    expect(context.Git.openRepository).not.toHaveBeenCalled()
  },
)

test('Markdown teardown waits for Git model disposal before deleting .git', async () => {
  const closing = Promise.withResolvers<void>()
  const waiting = Promise.withResolvers<void>()
  const remove = jest.fn(async (_name: string) => {})
  const cleaning = teardown({
    Editor: { closeAll: async () => {} },
    QuickPick: { executeCommand: async () => {} },
    SourceControl: {
      shouldHaveRepositoryCount: async (count: number) => {
        expect(count).toBe(0)
        waiting.resolve()
        await closing.promise
      },
    },
    Workspace: { updateWorkspaceSettings: async () => {}, remove },
  })
  await Promise.race([
    waiting.promise,
    cleaning.then(() => {
      throw new Error('Cleanup finished without waiting for Git model disposal')
    }),
  ])
  expect(remove).not.toHaveBeenCalled()
  closing.resolve()
  await cleaning
  expect(remove).toHaveBeenCalledWith('.git')
})
