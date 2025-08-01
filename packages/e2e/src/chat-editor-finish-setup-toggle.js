export const skip = 1

export const setup = async ({ Editor, ChatEditor }) => {
  await Editor.closeAll()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor, Editor }) => {
  await ChatEditor.openFinishSetup()
  await ChatEditor.closeFinishSetup()
}

export const teardown = async ({ Editor }) => {
  await Editor.closeAll()
}
