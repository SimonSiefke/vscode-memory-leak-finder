import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `h1 {
  font-size: 20px
}

h2 {
  font-size: 15px;
}`,
      name: 'file.css',
    },
  ])
  await Editor.open('file.css')
  await Editor.shouldHaveBreadCrumb('file.css')
  await Editor.shouldHaveBreadCrumb('h1')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.fold()

  await Editor.unfold()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
