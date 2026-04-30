import type { TestContext } from '../types.js'

export const skip = 1

const testId = 'simple-browser-open-and-close-devtools'

export const setup = async ({ Editor, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SimpleBrowser.createMockServer({
    id: testId,
    port: 3001,
  })
}

export const run = async ({ Electron, SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.show({
    port: 3001,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Page A',
  })

  const initialWindowCount = await Electron.getWindowCount()
  const devtoolsWindowId = await SimpleBrowser.openDevtools()

  await Electron.closeWindow(devtoolsWindowId)
  await Electron.waitForWindowCount(initialWindowCount)
}

export const teardown = async ({ Editor, SimpleBrowser }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SimpleBrowser.disposeMockServer({
    id: testId,
  })
}
