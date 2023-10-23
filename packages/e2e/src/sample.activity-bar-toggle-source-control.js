export const skip = true

export const setup = async ({ ActivityBar }) => {
  await ActivityBar.hideCurrentView()
}

export const run = async ({ ActivityBar }) => {
  await ActivityBar.showSourceControl()
  await ActivityBar.hideCurrentView()
}
