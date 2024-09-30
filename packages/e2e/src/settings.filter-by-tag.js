export const skip = true

export const setup = async ({ Editor, SettingsEditor }) => {
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.ensureIdle()
  await SettingsEditor.collapseOutline()
}

export const run = async ({ SettingsEditor, SettingsEditorFilter, SettingsEditorCompletion }) => {
  await SettingsEditorFilter.select({
    filterName: 'Tag...',
    filterText: '@tag:',
  })
  await SettingsEditorCompletion.select('@tag:accessibility')
  await SettingsEditor.clear()
}
