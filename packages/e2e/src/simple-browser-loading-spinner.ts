import type { TestContext } from '../types.js'

export const skip = 1

const testId = 'simple-browser-loading-spinner'

export const setup = async ({ Editor, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SimpleBrowser.createDeferredMockServer({
    id: testId,
    port: 3001,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  const showPromise = SimpleBrowser.show({
    port: 3001,
  })

  await SimpleBrowser.shouldHaveTabLoadingSpinner()
  await SimpleBrowser.finishMockServerResponse({
    id: testId,
  })
  await showPromise
  await SimpleBrowser.shouldNotHaveTabLoadingSpinner()
}

export const teardown = async ({ Editor, SimpleBrowser }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SimpleBrowser.disposeMockServer({
    id: testId,
  })
}
