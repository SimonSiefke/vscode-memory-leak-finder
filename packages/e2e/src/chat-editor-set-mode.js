export const skip = 1

export const setup = async ({ Editor, ChatEditor }) => {
  await Editor.closeAll()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor }) => {
  await ChatEditor.setMode('Edit')
  await ChatEditor.setMode('Ask')
}

export const teardown = async ({ Editor }) => {
  await Editor.closeAll()
}
