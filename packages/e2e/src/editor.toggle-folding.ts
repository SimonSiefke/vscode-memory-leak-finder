import type { TestContext } from '../types.js'

const CLASS_COUNT = 4

export const skip = 1

<<<<<<< HEAD
export const setup = async ({ Editor, Workspace, SettingsEditor }: TestContext): Promise<void> => {
=======
export const setup = async ({ Editor, SettingsEditor, Workspace }: TestContext): Promise<void> => {
>>>>>>> origin/main
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
<<<<<<< HEAD
      name: 'large-file.ts',
      content: `// Large TypeScript file for folding test with ${CLASS_COUNT} classes
${classes.join('\n\n')}
`,
=======
      content: `// Large TypeScript file for folding test with ${CLASS_COUNT} classes
${classes.join('\n\n')}
`,
      name: 'large-file.ts',
>>>>>>> origin/main
    },
  ])

  await Editor.open('large-file.ts')
  await Editor.shouldHaveBreadCrumb('large-file.ts')
  // @ts-ignore
  await Editor.setCursor(3, 5)
  await Editor.shouldHaveSquigglyError()
  await Editor.shouldHaveBreadCrumb('constructor')
  await Editor.splitRight()
  // Enable folding setting
  await SettingsEditor.open()
  await SettingsEditor.search({
<<<<<<< HEAD
    value: 'editor.folding',
    resultCount: 5,
=======
    resultCount: 5,
    value: 'editor.folding',
>>>>>>> origin/main
  })
  await SettingsEditor.enableCheckBox({
    name: 'editor.folding',
  })
}

<<<<<<< HEAD
export const run = async ({ SettingsEditor, Editor }: TestContext): Promise<void> => {
=======
export const run = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
>>>>>>> origin/main
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
