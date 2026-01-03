import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, SettingsEditor, Workspace, SideBar }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `class MyClass {
  myMethod(): void {
    const myFunction = () => {
      return 42
    }
    return myFunction()
  }
}
`,
      name: 'file.ts',
    },
  ])
  await SideBar.hide()
  await Editor.closeAll()
  await Editor.open('file.ts')
  await Editor.splitRight()
  await SettingsEditor.open()
  await SettingsEditor.search({
    resultCount: 1,
    value: 'editor.semanticHighlighting.enabled',
  })
  await SettingsEditor.select({
    name: 'editor.semanticHighlighting.enabled',
    value: 'configuredByTheme',
  })
  await Editor.switchToTab('file.ts')
  await Editor.focus()
  await Editor.click('myFunction')
  await Editor.inspectTokens()
  await Editor.shouldHaveInspectedToken('myFunction10 chars')
  await Editor.shouldHaveSemanticToken('function')
  await Editor.closeInspectedTokens()
}

export const run = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await SettingsEditor.select({
    name: 'editor.semanticHighlighting.enabled',
    value: 'false',
  })
  await Editor.switchToTab('file.ts')
  await Editor.focus()
  await Editor.click('myFunction')
  await Editor.inspectTokens()
  await Editor.shouldHaveInspectedToken('myFunction10 chars')
  await Editor.shouldNotHaveSemanticToken('class')
  await Editor.closeInspectedTokens()
  await SettingsEditor.select({
    name: 'editor.semanticHighlighting.enabled',
    value: 'configuredByTheme',
  })
  await Editor.switchToTab('file.ts')
  await Editor.focus()
  await Editor.click('myFunction')
  await Editor.inspectTokens()
  await Editor.shouldHaveInspectedToken('myFunction10 chars')
  await Editor.shouldHaveSemanticToken('function')
  await Editor.closeInspectedTokens()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
