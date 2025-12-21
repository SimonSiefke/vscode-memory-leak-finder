import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ ActivityBar, Search, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'sample text',
      name: 'file.txt',
    },
  ])
  await ActivityBar.showSearch()
  await Search.type('sample')
  await Search.toHaveResults(['file.txt1', 'sample text'])
}

export const run = async ({ Editor, Search }: TestContext): Promise<void> => {
  await Search.openEditor()
  await Editor.close()
}
