import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `# test
  `,
      name: 'index.md',
    },
  ])
  await Editor.open('index.md')
  await Editor.shouldHaveBreadCrumb('# test')
  await Editor.setCursor(2, 0)
}

export const run = async ({ Editor, Suggest }: TestContext): Promise<void> => {
  await Suggest.open('visibility, Property')
  await Suggest.close()
  await Editor.deleteAll()
  await Editor.shouldHaveText('')
  await Editor.type('[test](#')
  await new Promise(r=>{})
  await Editor.shouldHaveText('h1 { visibil }')
  await Editor.setCursor(1, 13)
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
