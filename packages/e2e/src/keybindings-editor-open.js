export const setup = async ({ Editor }) => {
  await Editor.closeAll()
}

export const run = async ({ KeyBindingsEditor, Editor }) => {
  await KeyBindingsEditor.show()
  await Editor.closeAll()
}
