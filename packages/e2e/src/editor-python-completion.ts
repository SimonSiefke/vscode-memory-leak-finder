import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ Editor, Workspace, Extensions }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([
    {
      content: `def add(a, b):
    result = a + b
    return result

if __name__ == '__main__':
    x = add(1, 2)
    print(
`,
      name: 'main.py',
    },
  ])
  await Extensions.install({
    id: 'ms-python.python',
    name: 'Python',
  })
  await Editor.open('main.py')
  await Editor.shouldHaveBreadCrumb('add')
  await Editor.setCursor(7, 10)
}

export const run = async ({ Suggest }: TestContext): Promise<void> => {
  await Suggest.open('x, Property')
  await Suggest.close()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
