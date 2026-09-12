import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ ActivityBar, Editor, Search, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'sample text',
      name: 'search-result.txt',
    },
  ])
  await Editor.closeAll()
  await ActivityBar.showSearch()
  await Search.type('sample')
  await Search.toHaveResults(['search-result.txt1', 'sample text'])
}

export const run = async ({ Editor, Search }: TestContext): Promise<void> => {
  try {
    await Search.openEditor()
  } finally {
    await Editor.closeAll()
  }
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
