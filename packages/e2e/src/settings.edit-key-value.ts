import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.search({
    resultCount: 2,
    value: 'Associations',
  })
  await SettingsEditor.ensureIdle()
}

export const run = async ({ SettingsEditor }: TestContext): Promise<void> => {
  await SettingsEditor.addItem({
    key: 'test-key',
    name: 'files.associations',
    value: 'test-value',
  })
  await SettingsEditor.removeItem({
    name: 'files.associations',
  })
}
