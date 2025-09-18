import type { TestContext } from '../types.js'

export const skip = process.platform === 'darwin'

export const setup = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.search({
    value: 'editor.autoClosingComments',
    resultCount: 1,
  })
}

export const run = async ({ SettingsEditor }: TestContext): Promise<void> => {
  await SettingsEditor.select({
    name: 'editor.autoClosingComments',
    value: 'never',
  })
  await SettingsEditor.select({
    name: 'editor.autoClosingComments',
    value: 'languageDefined',
  })
}
