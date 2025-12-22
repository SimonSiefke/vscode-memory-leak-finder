import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = 1

export const setup = async ({ Editor, Workspace, Extensions }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `def add(a,b,c):
  return a + b + `,
      name: 'index.py',
    },
  ])
  // @ts-ignore
  await Extensions.install({
    id: 'ms-python.python',
    name: 'Python',
  })
  await Editor.open('index.py')
  await Editor.shouldHaveBreadCrumb('index.py')
  await Editor.shouldHaveBreadCrumb('add')
  // @ts-ignore
  await Editor.setCursor(2, 15)
  await Editor.shouldHaveSquigglyError()
  await Editor.shouldHaveText(`def add(a,b,c):
  return a + b + `)
}

export const run = async ({ Suggest }: TestContext): Promise<void> => {
  // @ts-ignore
  await Suggest.open('bool')
  await Suggest.close()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
