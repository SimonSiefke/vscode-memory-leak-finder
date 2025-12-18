import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'index.css',
      content: 'h1 { visibil }',
    },
  ])
  await Editor.open('index.css')
  await Editor.shouldHaveBreadCrumb('h1')
  // @ts-ignore
  await Editor.setCursor(1, 13)
}

export const run = async ({ Suggest, Editor }: TestContext): Promise<void> => {
  // @ts-ignore
  await Suggest.open('visibility, Property')
  await Suggest.close()
  await Editor.deleteAll()
  await Editor.shouldHaveText('')
  await Editor.type('h1 { visibil }')
  await Editor.shouldHaveText('h1 { visibil }')
  // @ts-ignore
  await Editor.setCursor(1, 13)
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
