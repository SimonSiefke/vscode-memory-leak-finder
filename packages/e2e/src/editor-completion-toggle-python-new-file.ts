import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = 1

export const setup = async ({ Extensions, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `def add(a,b,c):
  return a + b + `,
      name: 'index.py',
    },
  ])
  await Extensions.install({
    id: 'ms-python.python',
    name: 'Python',
  })
}

export const run = async ({ Editor, Suggest, Workspace }: TestContext): Promise<void> => {
  await Editor.open('index.py')
  await Editor.shouldHaveBreadCrumb('index.py')
  await Editor.shouldHaveBreadCrumb('add')
  // @ts-ignore
  await Editor.setCursor(2, 15)
  await Editor.shouldHaveSquigglyError()
  await Editor.shouldHaveText(`def add(a,b,c):
  return a + b + `)
  // @ts-ignore
  await Suggest.open('bool, Class')
  await Suggest.close()
  await Editor.closeAll()
  await Workspace.setFiles([
    {
      content: `def add(a,b,c):
  return a + b + `,
      name: 'index.py',
    },
  ])
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
