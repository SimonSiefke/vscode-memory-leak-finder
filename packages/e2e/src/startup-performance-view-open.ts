import type { TestContext } from '../types.ts'

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}

export const run = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await QuickPick.executeCommand('Developer: Startup Performance')
  await Editor.shouldHaveActiveEditor()
  await Editor.closeAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
