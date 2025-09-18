import type { TestContext } from '../types.js'

export const setup = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SettingsEditor.open()
}

export const run = async ({ SettingsEditor }: TestContext): Promise<void> => {
  await SettingsEditor.search({
    value: 'editor.autoclosingcomments',
    resultCount: 1,
  })
  await SettingsEditor.clear()
}
