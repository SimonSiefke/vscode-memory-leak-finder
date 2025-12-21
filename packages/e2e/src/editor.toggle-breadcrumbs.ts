import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'sample text',
      name: 'file.txt',
    },
  ])
  await Editor.open('file.txt')
  await Editor.hideBreadCrumbs()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.showBreadCrumbs()
  await Editor.hideBreadCrumbs()
}
