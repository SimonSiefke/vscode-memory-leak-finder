import type { TestContext } from '../types.js'

export const setup = async ({ ActivityBar, Workspace, Search }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: 'sample text',
    },
  ])
  await ActivityBar.showSearch()
  await Search.collapseFiles()
}

export const run = async ({ Search }: TestContext): Promise<void> => {
  await Search.expandFiles()
  await Search.collapseFiles()
}
