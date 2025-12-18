import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ Electron, Editor, ChatEditor, Extensions, ExtensionDetailView, SideBar }: TestContext): Promise<void> => {
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
  // @ts-ignore
  await ChatEditor.clearAll()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor }: TestContext): Promise<void> => {
  // @ts-ignore
  await ChatEditor.sendMessage(`What is displayed on https://example.com`, {
    verify: true,
  })
  // @ts-ignore
  await ChatEditor.clearAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
