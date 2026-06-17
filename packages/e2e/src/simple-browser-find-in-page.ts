import type { TestContext } from '../types.js'

const testId = 'simple-browser-find-in-page'

export const skip = 1

export const setup = async ({ Editor, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SimpleBrowser.createMockServer({
    id: testId,
    port: 3001,
  })
}

export const run = async ({ DropDownContextMenu, SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.show({
    port: 3001,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Page A',
  })
  await SimpleBrowser.openMoreActions()
  await DropDownContextMenu.shouldHaveItem('Find in Page')
  await DropDownContextMenu.select('Find in Page')
  await SimpleBrowser.shouldHaveFindWidget()
}

export const teardown = async ({ Editor, SimpleBrowser }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SimpleBrowser.disposeMockServer({
    id: testId,
  })
}
