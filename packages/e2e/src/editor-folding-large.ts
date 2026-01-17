import type { TestContext } from '../types.ts'

const CLASS_COUNT = 4000

export const skip = 1

export const setup = async ({ Editor, SettingsEditor, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()

  // Enable folding setting
  await SettingsEditor.open()
  await SettingsEditor.search({
    resultCount: 5,
    value: 'editor.folding',
  })
  await SettingsEditor.enableCheckBox({
    name: 'editor.folding',
  })
  await Editor.closeAll()

  // Create a large TypeScript file with many foldable regions
  const classes = []
  for (let i = 1; i <= CLASS_COUNT; i++) {
    classes.push(`class a${i} {
  constructor() {
    this.value = 123
  }
}`)
  }

  await Workspace.setFiles([
    {
      content: `// Large TypeScript file for folding test with 4000 classes
${classes.join('\n\n')}
`,
      name: 'large-file.ts',
    },
  ])

  await Editor.open('large-file.ts')
  await Editor.shouldHaveBreadCrumb('large-file.ts')
  await Editor.setCursor(3, 5)
  await Editor.shouldHaveSquigglyError()
  await Editor.shouldHaveBreadCrumb('constructor')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.foldAll()

  await Editor.unfoldAll()
}

export const teardown = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await Editor.closeAll()

  // Disable folding setting
  await SettingsEditor.open()
  await SettingsEditor.search({
    resultCount: 5,
    value: 'editor.folding',
  })
  await SettingsEditor.disableCheckBox({
    name: 'editor.folding',
  })

  await Editor.closeAll()
}
