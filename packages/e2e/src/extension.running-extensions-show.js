export const setup = async ({ Editor }) => {
  await Editor.closeAll()
}

export const run = async ({ Editor, Extensions }) => {
  await Extensions.showRunningExtensions()
  await Editor.closeAll()
}
