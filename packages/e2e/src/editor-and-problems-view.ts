import type { TestContext } from '../types.ts'

export const skip = true

export const requiresNetwork = 1

export const setup = async ({ Editor, Problems, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `h1 {
  abc
}`,
      name: 'index.css',
    },
  ])
  await Editor.open('index.css')
  await Editor.shouldHaveSquigglyError()
  await Problems.show()
  await Editor.focus()
  await Problems.shouldHaveCount(2)
}

export const run = async ({ Editor, Problems }: TestContext): Promise<void> => {
  await Editor.shouldHaveSquigglyError()
  await Problems.shouldHaveCount(2)
  await Editor.click('abc')
  await Editor.deleteCharactersLeft({ count: 1 })
  await Editor.deleteCharactersRight({ count: 2 })
  await Editor.type('font-size: 10px;')
  await Editor.shouldNotHaveSquigglyError()
  await Problems.shouldHaveCount(0)
  await Editor.deleteCharactersLeft({ count: 16 })
  await Editor.type('abc')
  await Editor.shouldHaveSquigglyError()
  await Problems.shouldHaveCount(2)
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
