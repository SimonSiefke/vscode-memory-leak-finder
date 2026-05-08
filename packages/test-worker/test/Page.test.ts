import { expect, jest, test } from '@jest/globals'

const getFrameTree = jest.fn<(sessionRpc: any) => Promise<any>>()
const addUtilityExecutionContext = jest.fn<(sessionRpc: any, name: string, frameId: string) => Promise<any>>()
const reload = jest.fn<(rpc: any) => Promise<any>>()

await jest.unstable_mockModule('../src/parts/DevtoolsProtocol/DevtoolsProtocol.ts', () => ({
  DevtoolsProtocolPage: {
    getFrameTree,
  },
  DevtoolsProtocolRuntime: {},
  DevtoolsProtocolTarget: {},
}))

await jest.unstable_mockModule('../src/parts/AddUtilityExecutionContext/AddUtilityExecutionContext.ts', () => ({
  addUtilityExecutionContext,
}))

await jest.unstable_mockModule('../src/parts/PageReload/PageReload.ts', () => ({
  reload,
}))

const Page = await import('../src/parts/Page/Page.ts')

test('reload returns a page with a fresh utility context after frame refresh', async () => {
  const initialUtilityContext = { uniqueId: 'old-context' }
  const nextUtilityContext = { uniqueId: 'new-context' }
  getFrameTree.mockReset()
  addUtilityExecutionContext.mockReset()
  reload.mockReset()

  getFrameTree
    .mockResolvedValueOnce({
      frameTree: {
        frame: {
          id: 'frame-1',
          loaderId: 'loader-1',
        },
      },
    } as any)
    .mockResolvedValueOnce({
      frameTree: {
        frame: {
          id: 'frame-1',
          loaderId: 'loader-1',
        },
      },
    } as any)
    .mockResolvedValueOnce({
      frameTree: {
        frame: {
          id: 'frame-2',
          loaderId: 'loader-2',
        },
      },
    } as any)
    .mockResolvedValueOnce({
      frameTree: {
        frame: {
          id: 'frame-2',
          loaderId: 'loader-2',
        },
      },
    } as any)
  addUtilityExecutionContext.mockResolvedValue(nextUtilityContext as any)
  reload.mockResolvedValue(undefined as any)

  const page = Page.create({
    browserRpc: {},
    electronObjectId: 'electron-object-id',
    electronRpc: {
      canUseIdleCallback: false,
    },
    idleTimeout: 1000,
    rpc: {},
    sessionId: 'session-id',
    sessionRpc: {},
    targetId: 'target-id',
    utilityContext: initialUtilityContext,
  })

  const reloadedPage = await page.reload()

  expect(reload).toHaveBeenCalledTimes(1)
  expect(addUtilityExecutionContext).toHaveBeenCalledTimes(1)
  expect(addUtilityExecutionContext).toHaveBeenCalledWith(page.sessionRpc, 'utility', 'frame-2')
  expect(reloadedPage).not.toBe(page)
  expect(reloadedPage.utilityContext).toBe(nextUtilityContext)
  expect(reloadedPage.keyboard.utilityContext).toBe(nextUtilityContext)
  expect(reloadedPage.mouse.utilityContext).toBe(nextUtilityContext)
})
