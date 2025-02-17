export const setup = async ({ Editor, SettingsEditor }) => {
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.search({
    value: 'Associations',
    resultCount: 2,
  })
  await SettingsEditor.ensureIdle()
}

export const run = async ({ SettingsEditor }) => {
  await SettingsEditor.addItem({
    name: 'files.associations',
    key: 'test-key',
    value: 'test-value',
  })
  await SettingsEditor.removeItem({
    name: 'files.associations',
  })
}
