import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}

export const run = async ({ Editor, SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.showLoadError({
    url: 'abc',
  })
  await SimpleBrowser.shouldHaveLoadError({
    text: 'Name not resolved',
    title: 'Failed to Load Page',
  })
  await Editor.closeAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
