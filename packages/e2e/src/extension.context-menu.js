export const skip = true

export const setup = async ({ Extensions, Editor }) => {
  await Editor.closeAll()
  await Extensions.show()
  await Extensions.search('@builtin html ')
  await Extensions.first.shouldBe('HTML Language Basics')
}

export const run = async ({ Extensions, ContextMenu }) => {
  await Extensions.first.openContextMenu()
  await ContextMenu.close()
}
