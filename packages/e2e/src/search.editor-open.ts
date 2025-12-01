import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ ActivityBar, Search, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: 'sample text',
    },
  ])
  await ActivityBar.showSearch()
  await Search.type('sample')
  await Search.toHaveResults(['file.txt1', 'sample text'])
}

export const run = async ({ Search, Editor }: TestContext): Promise<void> => {
  await Search.openEditor()
  await Editor.close()
}
