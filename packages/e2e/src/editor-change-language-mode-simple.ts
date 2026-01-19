import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, SideBar, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'console.log("Hello World");',
      name: 'test.js',
    },
  ])
  await Editor.closeAll()
  await Editor.open('test.js')
  await SideBar.hide()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.open('test.js')
  await Editor.setLanguageMode('TypeScript')
  await Editor.setLanguageMode('JavaScript')
  await Editor.setLanguageMode('HTML')
  await Editor.setLanguageMode('Python')
  await Editor.setLanguageMode('Clojure')
  await Editor.setLanguageMode('JavaScript')
  await Editor.closeAll()
}

export const teardown = async ({ Editor }: TestContext) => {
  await Editor.closeAllEditorGroups()
  await Editor.closeAll()
}
