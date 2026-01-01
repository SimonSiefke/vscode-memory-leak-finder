import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, Workspace, SideBar }: TestContext): Promise<void> => {
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
  // @ts-ignore
  await Editor.goToEndOfLine()
  await Editor.shouldHaveBreadCrumb('?')
  await new Promise((r) => {
    setTimeout(r, 1000)
  })
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.type('/')
  await Editor.shouldHaveText(`<h1>hello world</h1>`)
  // await Editor.undo()
  // await Editor.shouldHaveText(`<h1>hello world<`)
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
