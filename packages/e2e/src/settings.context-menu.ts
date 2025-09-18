import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({  Editor, SettingsEditor  }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.search({
    value: 'Editor: Auto Closing Comments',
    resultCount: 2,
  })
}

export const run = async ({  SettingsEditor, ContextMenu  }: TestContext): Promise<void> => {
  await SettingsEditor.openSettingsContextMenu('Comments')
  await ContextMenu.shouldHaveItem('Reset Setting')
  await ContextMenu.close()
}
