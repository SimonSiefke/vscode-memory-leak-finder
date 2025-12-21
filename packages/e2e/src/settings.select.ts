import type { TestContext } from '../types.ts'

export const skip = process.platform === 'darwin'

export const setup = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.search({
    resultCount: 1,
    value: 'editor.autoClosingComments',
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
