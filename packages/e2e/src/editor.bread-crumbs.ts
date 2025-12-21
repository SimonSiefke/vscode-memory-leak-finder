import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `:root {
  --font-size: 10px;
  --font-size: 10px;
}`,
      name: 'index.css',
    },
  ])
  await Editor.open('index.css')
  await Editor.shouldHaveText(`:root {
  --font-size: 10px;
  --font-size: 10px;
}`)
  await Editor.shouldHaveBreadCrumb(':root')
}

export const run = async ({}) => {}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
