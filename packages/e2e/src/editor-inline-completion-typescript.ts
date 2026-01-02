import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, Workspace, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([
    {
      content: 'a',
      name: 'test.ts',
    },
  ])
  await Editor.open('test.ts')
  await Editor.shouldHaveBreadCrumb('test.ts')
  await SideBar.hide()
  // @ts-ignore
  await Editor.waitforTextFileReady('test.ts')
  await Editor.shouldHaveText('a')
  await Editor.deleteAll()
  await Editor.save({ viaKeyBoard: true })
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.shouldHaveText('')
  await Editor.type('a')
  // @ts-ignore
  await Editor.shouldHaveInlineCompletion('bcdef')
  // @ts-ignore
  await Editor.acceptInlineCompletion()
  await Editor.shouldHaveText('abcdef')
  await Editor.deleteAll()
  await Editor.save({ viaKeyBoard: true })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
