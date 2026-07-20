import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `# test
[test](`,
      name: 'index.md',
    },
  ])
  await Editor.open('index.md')
  await Editor.shouldHaveBreadCrumb('# test')
  await Editor.setCursor(2, 8)
}

export const run = async ({  Suggest }: TestContext): Promise<void> => {
  await Suggest.open('#test')
  await Suggest.close()

}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
