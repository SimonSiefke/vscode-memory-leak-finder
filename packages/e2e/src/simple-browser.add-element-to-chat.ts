import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SimpleBrowser.createMockServer({
    id: 'simple-browser-show',
    port: 3001,
  })
}

export const run = async ({ Editor, SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.show({
    port: 3001,
  })
  await SimpleBrowser.addElementToChat({
    selector: 'h1',
  })
  await new Promise((r) => {})
  await Editor.closeAll()
}

export const teardown = async ({ Editor, SimpleBrowser }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SimpleBrowser.disposeMockServer({
    id: 'simple-browser-show',
  })
}
