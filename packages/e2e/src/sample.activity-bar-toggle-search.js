export const setup = async ({ ActivityBar }) => {
  await ActivityBar.hideCurrentView()
}

export const run = async ({ ActivityBar }) => {
  await ActivityBar.showSearch()
  await ActivityBar.hideCurrentView()
}
