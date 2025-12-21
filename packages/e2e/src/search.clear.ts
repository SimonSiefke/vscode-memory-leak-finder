import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ ActivityBar, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'sample text',
      name: 'file.txt',
    },
  ])
  await ActivityBar.showSearch()
}

export const run = async ({ Search }: TestContext): Promise<void> => {
  await Search.type('sample')
  await Search.toHaveResults(['file.txt1', 'sample text'])
  await Search.clear()
}
