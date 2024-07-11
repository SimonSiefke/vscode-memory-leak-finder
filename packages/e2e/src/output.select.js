export const setup = async ({ Editor, Output, Panel }) => {
  await Editor.closeAll()
  await Panel.hide()
  await Output.show()
  await Output.select('Main')
}

export const run = async ({ Output }) => {
  await Output.select('Window')
  await Output.select('Main')
}
