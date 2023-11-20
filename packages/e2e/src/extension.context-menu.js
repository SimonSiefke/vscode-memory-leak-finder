export const skip = process.platform === 'darwin'

export const setup = async ({ Extensions }) => {
  await Extensions.show()
  await Extensions.search('@builtin html ')
  await Extensions.first.shouldBe('HTML Language Basics')
}

export const run = async ({ Extensions, ContextMenu }) => {
  await Extensions.first.openContextMenu()
  await ContextMenu.close()
}
