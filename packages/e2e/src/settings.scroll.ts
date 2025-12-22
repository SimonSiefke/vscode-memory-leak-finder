import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Settings, SettingsEditor, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
  await Settings.open()
  await SettingsEditor.search({
    resultCount: 498,
    value: 'editor',
  })
}

export const run = async ({ SettingsEditor }: TestContext): Promise<void> => {
  // @ts-ignore
  await SettingsEditor.scrollDown(20, 20)
  // @ts-ignore
  await SettingsEditor.scrollUp(-20, 0)
}
