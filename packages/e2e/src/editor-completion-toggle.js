export const setup = async ({ Editor }) => {
  await Editor.open('index.html')
}

export const run = async ({ Suggest }) => {
  await Suggest.open()
  await Suggest.close()
}
