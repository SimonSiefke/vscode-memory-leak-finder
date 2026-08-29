import type { TestContext } from '../types.ts'

export const skip = 1

const content = `:root {
  --font-size: 10px;
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
  await Editor.save({ viaKeyBoard: false })
}

export const run = async ({ Editor, References }: TestContext): Promise<void> => {
  await Editor.click('--font-size')
  await Editor.findAllReferences()
  await References.shouldBeVisible()
  await References.shouldHaveMessage('2 results in 1 file')
  await References.clear()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
