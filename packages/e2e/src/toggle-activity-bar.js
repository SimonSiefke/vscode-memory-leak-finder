export const setup = async ({ Editor }) => {
  await Editor.closeAll()
}

export const run = async ({ ActivityBar }) => {
  await ActivityBar.hide()
  await ActivityBar.show()
}
