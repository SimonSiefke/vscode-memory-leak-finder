export const skip = 1

export const setup = async ({ Editor, ChatEditor }) => {
  await Editor.closeAll()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor, Editor }) => {
  // TODO send message and clear it
  await ChatEditor.sendMessage('test')
}
