export const setup = async ({ Editor }) => {
  await Editor.closeAll()
}

export const run = async ({ Profile }) => {
  await Profile.show()
  await Profile.export({
    name: 'test',
  })
}
