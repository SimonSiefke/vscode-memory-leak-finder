import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ Workspace, Editor }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'index.css',
      content: `:root {
  --font-size: 10px;
}`,
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
  await Editor.shouldHaveCursor(/(53px|58px|66px)/)
  await Editor.renameCancel('--abc')
  await Editor.shouldHaveText(`:root {
  --font-size: 10px;
}`)
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
