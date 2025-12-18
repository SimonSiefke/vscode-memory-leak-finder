import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ ActivityBar, Workspace, Explorer }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: 'sample text',
    },
  ])
  await Explorer.focus()
  await ActivityBar.showSearch()
}

export const run = async ({ SideBar }: TestContext): Promise<void> => {
  await SideBar.hide()
  await SideBar.show()
}
