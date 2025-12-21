import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `:root {
  --font-size: 10px;
}`,
      name: 'index.css',
    },
  ])
  await Editor.open('index.css')
  await Editor.shouldHaveText(`:root {
  --font-size: 10px;
}`)
  await Editor.type('abc')
  await Editor.deleteCharactersLeft({ count: 3 })
  await Editor.shouldHaveToken('--font-size', 'rgb(156, 220, 254)')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.click('--font-size')
  await Editor.shouldHaveCursor(/(50px|53px|58px|66px)/)
  // @ts-ignore
  await Editor.renameWithPreview('--abc')
  await Editor.shouldHaveText(`:root {
  --abc: 10px;
}`)
  // @ts-ignore
  await Editor.renameWithPreview('--font-size')
  await Editor.shouldHaveText(`:root {
  --font-size: 10px;
}`)
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
