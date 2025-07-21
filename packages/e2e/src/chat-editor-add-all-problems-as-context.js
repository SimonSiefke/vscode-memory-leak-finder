export const skip = 1

export const setup = async ({ Editor, ChatEditor }) => {
  await Editor.closeAll()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor }) => {
  await ChatEditor.addContext('Problems...', 'All Problems', 'All Problems')
  await ChatEditor.clearContext('All Problems')
}
