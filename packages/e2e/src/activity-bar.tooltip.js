export const skip = false

export const run = async ({ ActivityBar, Explorer }) => {
  await Explorer.focus()
  await ActivityBar.showTooltipExplorer()
  await ActivityBar.hideTooltip()
}
