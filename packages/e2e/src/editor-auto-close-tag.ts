import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, SideBar, Workspace }: TestContext): Promise<void> => {
  await SideBar.hide()
  await Workspace.setFiles([
    {
      content: '<h1>hello world<',
      name: 'index.html',
    },
  ])
  await Editor.open('index.html')
  await Editor.shouldHaveText(`<h1>hello world<`)
  await Editor.shouldHaveBreadCrumb('h1')
  await Editor.setCursor(1, 17)
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.type('/')
  await Editor.shouldHaveText(`<h1>hello world</h1>`)
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
