import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, ChatEditor, Extensions, ExtensionDetailView, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Extensions.show()
  await Extensions.search('github copilot chat')
  await Extensions.first.shouldBe('GitHub Copilot Chat')
  await Extensions.first.click()
  await ExtensionDetailView.installExtension()
  await SideBar.hide()
  await Editor.closeAll()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor }: TestContext): Promise<void> => {
  // TODO send message and clear it
  // @ts-ignore
  await ChatEditor.sendMessage(`What is displayed on https://example.com`, {
    verify: true,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
