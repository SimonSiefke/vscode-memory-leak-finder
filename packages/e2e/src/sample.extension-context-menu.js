export const setup = async ({ Extensions }) => {
  await Extensions.show()
}

export const run = async ({ Extensions, ContextMenu }) => {
  await Extensions.first.openContextMenu()
  await ContextMenu.close()
}
