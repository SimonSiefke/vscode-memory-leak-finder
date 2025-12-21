import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = 1

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: '<h1>hello world</h1>',
      name: 'index.html',
    },
  ])
  await Editor.open('index.html')
  await Editor.shouldHaveBreadCrumb('h1')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  // @ts-ignore
  await Editor.toggleScreenReaderAccessibilityMode()
  // @ts-ignore
  await Editor.toggleScreenReaderAccessibilityMode()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
