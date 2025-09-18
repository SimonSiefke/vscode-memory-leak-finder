import type { TestContext } from '../types.js'

export const setup = async ({ ActivityBar, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: 'sample text',
    },
  ])
  await ActivityBar.showSearch()
}

export const run = async ({ Search }: TestContext): Promise<void> => {
  await Search.type('not-found')
  await Search.shouldHaveNoResults()
  await Search.clear()
}
