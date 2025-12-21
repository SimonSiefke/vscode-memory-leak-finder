import type { TestContext } from '../types.ts'

export const setup = async ({ ActivityBar, Search, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'sample text',
      name: 'file.txt',
    },
  ])
  await ActivityBar.showSearch()
  await Search.collapseFiles()
}

export const run = async ({ Search }: TestContext): Promise<void> => {
  await Search.expandFiles()
  await Search.collapseFiles()
}
