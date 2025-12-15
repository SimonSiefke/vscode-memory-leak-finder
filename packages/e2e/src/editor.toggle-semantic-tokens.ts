import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Workspace, SettingsEditor }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'file.ts',
      content: `class MyClass {
  myMethod(): void {
    const myFunction = () => {
      return 42
    }
    return myFunction()
  }
}
`,
    },
  ])
  await Editor.closeAll()
  await Editor.open('file.ts')
  await Editor.splitRight()
  await SettingsEditor.open()
  await SettingsEditor.search({
    value: 'editor.semanticHighlighting.enabled',
    resultCount: 1,
  })
  await SettingsEditor.select({
    name: 'editor.semanticHighlighting.enabled',
    value: 'configuredByTheme',
  })
}

export const run = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await Editor.switchToTab('file.ts')
  await Editor.focus()
  await Editor.click('class')
  await Editor.inspectTokens()
  await Editor.shouldHaveInspectedToken('class5 chars')
  await Editor.shouldHaveSemanticToken('class')
  await Editor.closeInspectedTokens()
  await SettingsEditor.select({
    name: 'editor.semanticHighlighting.enabled',
    value: 'off',
  })
  await Editor.switchToTab('file.ts')
  await Editor.focus()
  await Editor.click('class')
  await Editor.inspectTokens()
  await Editor.shouldHaveInspectedToken('class5 chars')
  await Editor.shouldNotHaveSemanticToken('class')
  await Editor.closeInspectedTokens()
  await SettingsEditor.select({
    name: 'editor.semanticHighlighting.enabled',
    value: 'configuredByTheme',
  })
  await Editor.switchToTab('file.ts')
  await Editor.focus()
  await Editor.click('class')
  await Editor.inspectTokens()
  await Editor.shouldHaveInspectedToken('class5 chars')
  await Editor.shouldHaveSemanticToken('class')
  await Editor.closeInspectedTokens()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
