export const skip = true

export const setup = async ({ Editor, Electron }) => {
  await Editor.closeAll()
  await Electron.mockDialog({
    response: 1,
  })
}

export const run = async ({ Profile }) => {
  await Profile.create({
    name: 'test',
    removeOthers: true,
  })
  await Profile.remove({
    name: 'test',
  })
}
