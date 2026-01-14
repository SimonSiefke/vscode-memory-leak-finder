import type { TestContext } from '../types.js'

export const setup = async ({ Editor, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
}

export const run = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await SettingsEditor.open()
  await Editor.splitDown()
  await Editor.closeAll()
}
