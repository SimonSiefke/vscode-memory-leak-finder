export const setup = async ({ Editor }) => {
  await Editor.closeAll()
}

export const run = async ({ Editor, Extensions }) => {
  await Editor.closeAll()
  await Extensions.showRunningExtensions()
}
