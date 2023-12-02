export const skip = true

export const run = async ({ ActivityBar, Explorer }) => {
  await Explorer.focus()
  await ActivityBar.showTooltipExplorer()
  await ActivityBar.hideTooltip()
}
