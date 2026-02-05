import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SettingsEditor.open()
}

export const run = async ({ SettingsEditor }: TestContext): Promise<void> => {
  await SettingsEditor.search({
    resultCount: 1,
    value: 'editor.autoclosingcomments',
  })
  await SettingsEditor.clear()
}
