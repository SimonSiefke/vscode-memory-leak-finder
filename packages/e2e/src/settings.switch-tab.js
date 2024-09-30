export const skip = true

export const setup = async ({ Editor, SettingsEditor }) => {
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.ensureIdle()
  await SettingsEditor.collapseOutline()
}

export const run = async ({ SettingsEditor }) => {
  await SettingsEditor.openTab('Workspace')
  await SettingsEditor.openTab('User')
}
