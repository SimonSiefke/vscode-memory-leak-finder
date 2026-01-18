import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: '<h1>hello world</h1>',
      name: 'index.html',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('index.html')
  await Editor.open('index.html')
  await Editor.setCursor(1, 1)
  await Editor.shouldHaveBreadCrumb('index.html')
  await Editor.shouldHaveBreadCrumb('h1')
}

export const run = async ({ Editor, Hover }: TestContext): Promise<void> => {
  await Editor.hover('h1', /The h1 element represents a section heading/)
  await Hover.hide()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
