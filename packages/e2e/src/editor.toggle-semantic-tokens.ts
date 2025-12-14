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
}

export const run = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await Editor.click('class')
  await Editor.inspectTokens()
  await Editor.shouldHaveInspectedToken('class')
  await Editor.shouldHaveSemanticToken('class')
  await Editor.closeInspectedTokens()
  await SettingsEditor.disableCheckBox({
    name: 'editor.semanticHighlighting.enabled',
  })
  await Editor.click('class')
  await Editor.inspectTokens()
  await Editor.shouldHaveInspectedToken('class')
  await Editor.shouldNotHaveSemanticToken('class')
  await Editor.closeInspectedTokens()
  await SettingsEditor.enableCheckBox({
    name: 'editor.semanticHighlighting.enabled',
  })
  await Editor.click('class')
  await Editor.inspectTokens()
  await Editor.shouldHaveInspectedToken('class')
  await Editor.shouldHaveSemanticToken('class')
  await Editor.closeInspectedTokens()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}

