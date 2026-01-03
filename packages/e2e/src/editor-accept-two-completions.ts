import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, SideBar, Workspace }: TestContext): Promise<void> => {
  await SideBar.hide()
  await Workspace.setFiles([
    {
      content: `h1 {
  visibil
}`,
      name: 'index.css',
    },
  ])
  await Editor.open('index.css')
  await Editor.shouldHaveText(`h1 {
  visibil
}`)
  await Editor.shouldHaveBreadCrumb('h1')
  await Editor.setCursor(2, 8)
}

export const run = async ({ Editor, Suggest }: TestContext): Promise<void> => {
  // @ts-ignore
  await Suggest.open('visibility, Property')
  // @ts-ignore
  await Suggest.accept('visibility, Property')
  const space = ' '
  await Editor.shouldHaveText(`h1 {
  visibility:${space}
}`)
  // @ts-ignore
  await Suggest.accept(`hidden, Value`)
  await Editor.shouldHaveText(`h1 {
  visibility: hidden
}`)
  await Editor.undo()
  await Editor.undo()
  await Editor.shouldHaveText(`h1 {
  visibil
}`)
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
