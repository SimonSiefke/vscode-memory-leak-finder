export const setup = async ({ Editor, SettingsEditor }) => {
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.search({
    value: 'editor.autoClosingComments',
    resultCount: 1,
  })
  await SettingsEditor.enableCheckBox({
    name: 'comments.visible',
  })
}

export const run = async ({ SettingsEditor }) => {
  await SettingsEditor.disableCheckBox({
    name: 'comments.visible',
  })
  await SettingsEditor.enableCheckBox({
    name: 'comments.visible',
  })
}
