import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.search({
    value: 'Associations',
    resultCount: 2,
  })
  await SettingsEditor.ensureIdle()
}

export const run = async ({ SettingsEditor }: TestContext): Promise<void> => {
  await SettingsEditor.addItem({
    name: 'files.associations',
    key: 'test-key',
    value: 'test-value',
  })
  await SettingsEditor.removeItem({
    name: 'files.associations',
  })
}
