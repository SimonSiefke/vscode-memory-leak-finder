import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({  Workspace, Editor  }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: 'sample text',
    },
  ])
  await Editor.open('file.txt')
  await Editor.hideBreadCrumbs()
}

export const run = async ({  Editor  }: TestContext): Promise<void> => {
  await Editor.showBreadCrumbs()
  await Editor.hideBreadCrumbs()
}
