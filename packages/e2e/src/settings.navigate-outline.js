export const setup = async ({ Editor, SettingsEditor }) => {
  await Editor.closeAll()
  await SettingsEditor.open()
}

export const run = async ({ SettingsEditor }) => {
  await SettingsEditor.focusOutline('Commonly Used')
  await SettingsEditor.focusOutline('Text Editor')
  await SettingsEditor.focusOutline('Workbench')
  await SettingsEditor.focusOutline('Window')
  await SettingsEditor.focusOutline('Features')
  await SettingsEditor.focusOutline('Application')
  await SettingsEditor.focusOutline('Security')
  await SettingsEditor.focusOutline('Extensions')
  await SettingsEditor.focusOutline('Commonly Used')
}
