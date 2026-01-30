import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `h1{
abc
}`,
      name: 'index.css',
    },
  ])
  await Editor.open('index.css')
  await Editor.shouldHaveBreadCrumb('index.css')
  await Editor.shouldHaveSquigglyError()
  await Editor.setCursor(1, 1)
}

export const run = async ({ Editor, Hover }: TestContext): Promise<void> => {
  await Editor.shouldHaveText(`h1{
abc
}`)
  await Editor.shouldHaveSquigglyError()

  // TODO use setCursor instead, then open hover
  await Editor.hover('}', /colon expected/)
  await Hover.hide()
  await Editor.setCursor(2, 1)
  await Editor.deleteCharactersRight({ count: 3 })
  await Editor.shouldHaveText(`h1{

}`)
  await Editor.shouldNotHaveSquigglyError()
  await Editor.type('abc')
  await Editor.shouldHaveText(`h1{
abc
}`)
  await Editor.shouldHaveSquigglyError()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.saveAll()
  await Editor.closeAll()
}
