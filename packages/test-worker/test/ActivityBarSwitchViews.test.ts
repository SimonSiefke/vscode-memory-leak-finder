import { expect, test } from '@jest/globals'

const { setup } = await import(new URL('../../e2e/src/activity-bar-switch-views.ts', import.meta.url).href)

test('setup waits for Marketplace results before hiding the sidebar', async () => {
  const loading = Promise.withResolvers<void>()
  const waiting = Promise.withResolvers<void>()
  const calls: string[] = []
  const context = {
    ActivityBar: {
      showExtensions: async () => {
        calls.push('open extensions')
      },
    },
    Extensions: {
      waitForProgressToBeHidden: async () => {
        calls.push('wait for results')
        waiting.resolve()
        await loading.promise
      },
    },
    SideBar: {
      hide: async () => {
        calls.push('hide sidebar')
      },
    },
  }
  const preparing = setup(context)
  await Promise.race([
    waiting.promise,
    preparing.then(() => {
      throw new Error('Setup finished without waiting for Marketplace results')
    }),
  ])
  expect(calls).toEqual(['open extensions', 'wait for results'])
  loading.resolve()
  await preparing
  expect(calls).toEqual(['open extensions', 'wait for results', 'hide sidebar'])
})
