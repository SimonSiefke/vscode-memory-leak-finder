import type { TestContext } from '../types.js'

export const skip = 1

// @ts-ignore
export const setup = async ({ Editor, EditorFind, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: '<h1>abc</h1>',
      name: 'index.html',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('index.html')
  await Editor.open('index.html')
  await Editor.shouldHaveText('<h1>abc</h1>')
  await Editor.shouldHaveBreadCrumb('index.html')
  await Editor.setCursor(1, 1)
  await Editor.shouldHaveBreadCrumb('h1')
  await Editor.closeFind()
  await Editor.openFind()
  await EditorFind.openReplace()
}

// @ts-ignore
export const run = async ({ Editor, EditorFind }: TestContext): Promise<void> => {
  await EditorFind.setSearchValue('abc')
  await EditorFind.setReplaceValue('def')
  await EditorFind.replace()
  await Editor.shouldHaveText('<h1>def</h1>')
  await EditorFind.setSearchValue('def')
  await EditorFind.setReplaceValue('abc')
  await EditorFind.replace()
  await Editor.shouldHaveText('<h1>abc</h1>')
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
