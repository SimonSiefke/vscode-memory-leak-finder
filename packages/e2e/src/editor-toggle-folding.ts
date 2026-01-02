import type { TestContext } from '../types.js'

const CLASS_COUNT = 4

export const skip = 1

export const setup = async ({ Editor, SettingsEditor, Workspace }: TestContext): Promise<void> => {
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
      content: `// Large TypeScript file for folding test with ${CLASS_COUNT} classes
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
  await Editor.splitRight()
  // Enable folding setting
  await SettingsEditor.open()
  await SettingsEditor.search({
    resultCount: 5,
    value: 'editor.folding',
  })
  await SettingsEditor.enableCheckBox({
    name: 'editor.folding',
  })
}

export const run = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await SettingsEditor.disableCheckBox({
    name: 'editor.folding',
  })
  // @ts-ignore
  await Editor.shouldHaveFoldingGutter(false)
  await SettingsEditor.enableCheckBox({
    name: 'editor.folding',
  })
  // @ts-ignore
  await Editor.shouldHaveFoldingGutter(true)
}

export const teardown = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await SettingsEditor.disableCheckBox({
    name: 'editor.folding',
  })
  await Editor.closeAll()
}
