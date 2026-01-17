import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, Workspace, SideBar }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'console.log("Hello World");',
      name: 'test.js',
    },
    {
      content: 'def hello():\n    print("Hello World")',
      name: 'test.py',
    },
  ])
  await Editor.closeAll()
  await Editor.open('test.js')
  await SideBar.hide()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.open('test.js')

  // Open the first editor and verify initial language
  // @ts-ignore
  await Editor.shouldHaveFile('test.js')

  // Change language from JavaScript to TypeScript
  await Editor.setLanguageMode('TypeScript')

  // Change language back to JavaScript
  await Editor.setLanguageMode('JavaScript')

  // Open a second editor in a new group
  // @ts-ignore
  await Editor.newEditorGroupRight()
  await Editor.open('test.py')

  // Change language from Python to HTML
  await Editor.setLanguageMode('HTML')

  // Switch back to Python
  await Editor.setLanguageMode('Python')

  // Switch back to the first editor
  await Editor.focusLeftEditorGroup()

  // Change language one more time to demonstrate multiple switches
  await Editor.setLanguageMode('Clojure')

  // Switch back to original JavaScript
  await Editor.setLanguageMode('JavaScript')

  await Editor.closeAll()
}

export const teardown = async ({ Editor }: TestContext) => {
  await Editor.closeAllEditorGroups()
  await Editor.closeAll()
}
