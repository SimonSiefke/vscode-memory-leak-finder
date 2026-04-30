import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const setup = async ({ Editor, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SimpleBrowser.show({
    url: 'https://example.com',
  })
}

export const run = async ({ Editor, SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.addElementToChat({
    selector: 'h1',
  })
  await SimpleBrowser.shouldHaveElementScreenshotInChat()
  await Editor.closeAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
