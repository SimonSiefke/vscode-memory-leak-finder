import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: '<main><h1>Accessibility lifecycle</h1></main>\n',
      name: 'index.html',
    },
  ])
  await Editor.closeAll()
  await Editor.goToFile({
    column: 8,
    file: 'index.html',
    line: 1,
  })
}

export const run = async ({ AccessibilityHelp }: TestContext): Promise<void> => {
  await AccessibilityHelp.open()
  await AccessibilityHelp.close()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
