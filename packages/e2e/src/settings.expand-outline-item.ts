import type { TestContext } from '../types.js'

export const setup = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SettingsEditor.open()
}

export const run = async ({ SettingsEditor }: TestContext): Promise<void> => {
  await SettingsEditor.expand('Text Editor')
  await SettingsEditor.collapse('Text Editor')
}
