export const setup = async ({ Editor, SettingsEditor }) => {
  await Editor.closeAll()
  await SettingsEditor.open()
}

export const run = async ({ SettingsEditor }) => {
  await SettingsEditor.expand('Text Editor')
  await SettingsEditor.collapse('Text Editor')
}
