import type { TestContext } from '../types.ts'

export const skip = true

export const run = async ({ ActivityBar, Explorer }: TestContext): Promise<void> => {
  await Explorer.focus()
  await ActivityBar.showSearch()
  await ActivityBar.showSourceControl()
  await ActivityBar.showRunAndDebug()
  await ActivityBar.showExtensions()
  await ActivityBar.showExplorer()
}
