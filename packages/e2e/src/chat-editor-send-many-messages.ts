import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ ChatEditor, Editor, Electron, ExtensionDetailView, Extensions, SideBar }: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })
  await Editor.closeAll()
  await Extensions.show()
  await Extensions.search('github copilot chat')
  await Extensions.first.shouldBe('GitHub Copilot Chat')
  await Extensions.first.click()
  await ExtensionDetailView.installExtension()
  await SideBar.hide()
  await Editor.closeAll()
  await Editor.closeAll()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor }: TestContext): Promise<void> => {
  // TODO send message and clear it
  for (let i = 0; i < 10; i++) {
    // @ts-ignore
    await ChatEditor.sendMessage({
      message: 'test',
      verify: true,
    })
  }
  // @ts-ignore
  await ChatEditor.clearAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
