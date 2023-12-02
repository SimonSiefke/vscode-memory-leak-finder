export const setup = async ({ Editor }) => {
  await Editor.closeAll()
}

export const run = async ({ Output }) => {
  await Output.show()
  await Output.hide()
}
