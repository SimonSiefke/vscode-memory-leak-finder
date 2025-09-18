import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.ensureIdle()
  await SettingsEditor.collapseOutline()
}

export const run = async ({ SettingsEditor, SettingsEditorFilter, SettingsEditorCompletion }: TestContext): Promise<void> => {
  await SettingsEditorFilter.select({
    filterName: 'Tag...',
    filterText: '@tag:',
  })
  await SettingsEditorCompletion.select({
    completionName: '@tag:accessibility',
    completionText: '@tag:accessibility',
  })
  await SettingsEditor.clear()
}
