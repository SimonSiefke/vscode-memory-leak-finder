import type { TestContext } from '../types.js'

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
  await Explorer.shouldHaveItem('index.html')
  await Editor.open('index.html')
  await Editor.shouldHaveText('<h1>abc</h1>')
  await Editor.shouldHaveBreadCrumb('index.html')
  // @ts-ignore
  await Editor.setCursor(1, 1)
  await Editor.shouldHaveBreadCrumb('h1')
  await Editor.closeFind()
  await Editor.openFind()
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
  await Editor.closeAll()
}
