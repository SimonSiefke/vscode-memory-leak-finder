import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: '<h1><spa</h1>',
      name: 'index.html',
    },
  ])
  await Editor.open('index.html')
  await Editor.shouldHaveBreadCrumb('h1')
  await Editor.setCursor(1, 9)
}

export const run = async ({ Editor, Suggest }: TestContext): Promise<void> => {
  await Suggest.open('span, Property')
  await Suggest.close()
  await Editor.deleteAll()
  await Editor.shouldHaveText('')
  await Editor.type('<h1><spa</h1>')
  await Editor.shouldHaveText('<h1><spa</h1>')
  await Editor.setCursor(1, 9)
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
