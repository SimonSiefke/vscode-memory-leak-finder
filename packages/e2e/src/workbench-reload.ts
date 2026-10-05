import type { TestContext } from '../types.ts'

const fileName = 'file.txt'
const fileContent = 'hello from reload test'

export const skip = 1

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: fileContent,
      name: fileName,
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem(fileName)
  await Editor.open(fileName)
}

export const run = async ({ Editor, Workbench }: TestContext): Promise<void> => {
  await Workbench.shouldBeVisible()
  await Editor.shouldHaveText(fileContent)
  // @ts-ignore
  await Workbench.reload()
  await Workbench.shouldBeVisible()
  await Editor.shouldHaveText(fileContent)
  await Workbench.focusLeftEditorGroup()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
