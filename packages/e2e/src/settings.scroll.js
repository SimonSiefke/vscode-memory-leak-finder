export const skip=true


export const setup = async ({ Editor, Settings }) => {
  await Editor.closeAll()
  await Settings.open()
}

export const run = async ({ SettingsEditor, }) => {
  // await Editor.closeAll()
  await SettingsEditor.scrollDown()
  // await SettingsEditor.scrollUp()
}
