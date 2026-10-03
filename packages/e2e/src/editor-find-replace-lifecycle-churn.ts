import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: '<h1>abc</h1>',
      name: 'index.html',
    },
  ])
  await Editor.closeAll()
  await Editor.open('index.html')
  await Editor.shouldHaveText('<h1>abc</h1>')
}

export const run = async ({ Editor, EditorFind }: TestContext): Promise<void> => {
  try {
    await Editor.openFind()
    await EditorFind.setSearchValue('abc')
    await EditorFind.openReplace()
    await EditorFind.setReplaceValue('def')
    await EditorFind.replace()
    await Editor.shouldHaveText('<h1>def</h1>')
    await EditorFind.setSearchValue('def')
    await EditorFind.setReplaceValue('abc')
    await EditorFind.replace()
    await Editor.shouldHaveText('<h1>abc</h1>')
  } finally {
    await Editor.closeFind()
  }
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
