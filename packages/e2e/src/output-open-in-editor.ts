import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Output, Panel }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Panel.hide()
  await Output.show()
}

export const run = async ({ Editor, Output }: TestContext): Promise<void> => {
  await Output.openEditor()
  await Editor.close()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}

