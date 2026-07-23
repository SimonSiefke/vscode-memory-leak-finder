import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ Workspace, Editor, LanguageModelEditor }: TestContext): Promise<void> => {
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
  // @ts-ignore
  await LanguageModelEditor.prepare()
}

export const run = async ({ Editor, LanguageModelEditor }: TestContext): Promise<void> => {
  // @ts-ignore
  await LanguageModelEditor.open({ hasItems: false })
  await Editor.splitDown({ groupCount: 0, splitInto: true })
  await Editor.closeAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
