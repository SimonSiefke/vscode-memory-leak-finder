import type { TestContext } from '../types.ts'

export const skip = 1

const content = `:root {
  --font-size: 10px;
}`

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content,
      name: 'index.css',
    },
  ])
  await Editor.closeAll()
  await Editor.open('index.css')
  await Editor.shouldHaveText(content)
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.click('--font-size')
  await Editor.rename('--renamed')
  await Editor.shouldHaveText(`:root {
  --renamed: 10px;
}`)
  await Editor.click('--renamed')
  await Editor.rename('--font-size')
  await Editor.shouldHaveText(content)
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
