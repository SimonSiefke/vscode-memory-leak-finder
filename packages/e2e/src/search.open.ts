import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ ActivityBar, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'sample text',
      name: 'file.txt',
    },
  ])
  await Explorer.focus()
  await ActivityBar.showSearch()
}

export const run = async ({ SideBar }: TestContext): Promise<void> => {
  await SideBar.hide()
  await SideBar.show()
}
