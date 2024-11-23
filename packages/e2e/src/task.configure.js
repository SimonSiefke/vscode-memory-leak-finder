export const skip = true

export const setup = async ({ Editor }) => {
  await Editor.closeAll()
}

export const run = async ({ Task }) => {
  await Task.open()
}
