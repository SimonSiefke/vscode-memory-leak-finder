import type { TestContext } from '../types.js'

export const skip = 1

const testId = 'simple-browser-open-and-close-devtools'
const openWebviewDeveloperToolsCommand = 'Developer: Open Webview Developer Tools'

const waitForWindowCount = async (Electron: TestContext['Electron'], expectedCount: number): Promise<void> => {
  const maxAttempts = 25
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const actualCount = await Electron.getWindowCount()
    if (actualCount === expectedCount) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`Expected ${expectedCount} windows`)
}

export const setup = async ({ Editor, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SimpleBrowser.createMockServer({
    id: testId,
    port: 3001,
  })
}

export const run = async ({ Electron, QuickPick, SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.show({
    port: 3001,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Page A',
  })

  const initialWindowCount = await Electron.getWindowCount()

  await QuickPick.executeCommand(openWebviewDeveloperToolsCommand, {
    pressKeyOnce: true,
  })

  await waitForWindowCount(Electron, initialWindowCount + 1)

  const devtoolsWindowId = await Electron.getNewWindowId()
  if (!devtoolsWindowId) {
    throw new Error('Expected devtools window to open')
  }

  await Electron.closeWindow(devtoolsWindowId)

  await waitForWindowCount(Electron, initialWindowCount)
}

export const teardown = async ({ Editor, SimpleBrowser }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SimpleBrowser.disposeMockServer({
    id: testId,
  })
}
