export const run = async ({ Editor }) => {
  await Editor.open('file.txt')
  await Editor.close()
}
