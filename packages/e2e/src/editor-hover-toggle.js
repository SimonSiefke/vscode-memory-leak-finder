export const skip = true
export const setup = async ({ Editor }) => {
  await Editor.open('index.html')
}

export const run = async ({ Editor, Hover }) => {
  await Editor.hover('h1')
  await Hover.hide()
}
