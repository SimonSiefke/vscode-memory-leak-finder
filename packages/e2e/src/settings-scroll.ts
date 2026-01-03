import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, SettingsEditor, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
  await SettingsEditor.open()
  await SettingsEditor.search({
    resultCount: 498, // TODO this is very specific
    value: 'editor',
  })
}

export const run = async ({ SettingsEditor }: TestContext): Promise<void> => {
  await SettingsEditor.moveScrollBar(200, 200)

  await SettingsEditor.moveScrollBar(-200, 0)
}
