import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Settings, SettingsEditor, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
  await Settings.open()
  await SettingsEditor.search({
    resultCount: 498, // TODO this is very specific
    value: 'editor',
  })
}

export const run = async ({ SettingsEditor }: TestContext): Promise<void> => {
  // @ts-ignore
  await SettingsEditor.moveScrollBar(200, 200)
  // @ts-ignore
  await SettingsEditor.moveScrollBar(-200, 0)
}
