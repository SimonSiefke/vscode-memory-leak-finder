export const setup = async ({ Editor, SettingsEditor }) => {
  await Editor.closeAll()
  await SettingsEditor.open()
}

export const run = async ({ SettingsEditor }) => {
  await SettingsEditor.search({
    value: 'editor.autoclosingcomments',
    resultCount: 1,
  })
  await SettingsEditor.clear()
}
