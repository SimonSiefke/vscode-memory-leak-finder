import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ Editor, Electron }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Electron.mockDialog({
    response: 1,
  })
}

export const run = async ({ Profile }: TestContext): Promise<void> => {
  await Profile.create({
    name: 'test',
    removeOthers: true,
  })
  await Profile.remove({
    name: 'test',
  })
}
