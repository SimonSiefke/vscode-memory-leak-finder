import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = 1

export const setup = async ({ Editor, Extensions, SideBar, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([
    {
      content: 'a',
      name: 'test.ts',
    },
  ])
  // @ts-ignore
  await Extensions.add({
    expectedName: 'inline-completion-provider-typescript',
    path: '.vscode-extensions-source/inline-completion-provider-typescript',
  })
  await Editor.open('test.ts')
  await Editor.shouldHaveBreadCrumb('test.ts')
  await Editor.shouldHaveSquigglyError()
  await Extensions.show()
  await Extensions.search(`@id:e2e-tests.inline-completion-provider-typescript`)
  await Extensions.first.shouldHaveActivationTime()
  await SideBar.hide()
  // @ts-ignore
  await Editor.waitforTextFileReady('test.ts')
  await Editor.deleteCharactersLeft({ count: 1 })
  await Editor.deleteAll()
  await Editor.save({ viaKeyBoard: true })
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.shouldHaveText('')
  await Editor.type('func')
  // @ts-ignore
  await Editor.acceptInlineCompletion()
  await Editor.shouldHaveText(`function add(a:number, b:number): number {
  return a+b
}
  `)
  await Editor.deleteAll()
  await Editor.save({ viaKeyBoard: true })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
