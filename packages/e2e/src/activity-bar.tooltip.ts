import type { TestContext } from '../types.ts'

export const skip = false

export const run = async ({ ActivityBar, Explorer }: TestContext): Promise<void> => {
  await Explorer.focus()
  await ActivityBar.showTooltipExplorer()
  await ActivityBar.hideTooltip()
}
