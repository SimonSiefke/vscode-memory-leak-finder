export const skip = true

export const setup = async ({ Editor }) => {
  await Editor.closeAll()
}

export const run = async ({ Profile }) => {
  await Profile.create({
    name: 'test',
  })
  await Profile.remove({
    name: 'test',
  })
}
