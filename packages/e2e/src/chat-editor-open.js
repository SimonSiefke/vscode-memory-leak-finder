export const skip = 1

export const setup = async ({ Editor }) => {
  await Editor.closeAll()
}

export const run = async ({ ChatEditor, Editor }) => {
  await ChatEditor.open()
  await Editor.closeAll()
}

export const teardown = async ({ Editor }) => {
  await Editor.closeAll()
}
