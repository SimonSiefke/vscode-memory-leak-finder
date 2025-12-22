import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = 1

export const setup = async ({ Editor, Workspace, Extensions }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `def add(a,b):
  return a + `,
      name: 'index.py',
    },
  ])
  // @ts-ignore
  await Extensions.install({
    id: 'ms-python.python',
    name: 'Python',
  })
  await Editor.open('index.py')
  // @ts-ignore
  await Editor.setCursor(2, 8)
  await Editor.shouldHaveBreadCrumb('index.py')
}

export const run = async ({ Suggest }: TestContext): Promise<void> => {
  await Suggest.open()
  await new Promise((r) => {})
  // TODO verify item is visible
  await Suggest.close()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
