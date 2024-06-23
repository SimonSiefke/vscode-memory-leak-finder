export const skip = true

export const setup = async ({ Editor, SettingsEditor }) => {
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.search({
    value: 'Editor: Auto Closing Comments',
    resultCount: 2,
  })
}

export const run = async ({ SettingsEditor, ContextMenu }) => {
  await SettingsEditor.openSettingsContextMenu('Comments')
  await ContextMenu.shouldHaveItem('Reset Setting')
  await ContextMenu.close()
}
