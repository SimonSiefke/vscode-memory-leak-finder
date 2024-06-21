export const skip = true

export const setup = async ({ Editor, SettingsEditor }) => {
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.search({
    value: 'Editor: Auto Closing Comments',
    resultCount: 2,
  })
}

export const run = async ({ SettingsEditor }) => {
  await SettingsEditor.select({
    name: 'editor.autoClosingComments',
    value: 'never',
  })
  await SettingsEditor.select({
    name: 'editor.autoClosingComments',
    value: 'languageDefined',
  })
}
