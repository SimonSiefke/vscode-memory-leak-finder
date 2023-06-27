export const setup = async ({ KeyBindingsEditor }) => {
  await KeyBindingsEditor.show()
}

export const run = async ({ KeyBindingsEditor }) => {
  await KeyBindingsEditor.setKeyBinding('Copy', 'Control+L')
  await KeyBindingsEditor.setKeyBinding('Copy', 'Control+C')
}
