import type { TestContext } from '../types.ts'

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
  await Search.type('not-found')
  await Search.shouldHaveNoResults()
  await Search.clear()
}
