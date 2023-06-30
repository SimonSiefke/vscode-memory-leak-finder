export const run = async ({ ActivityBar }) => {
  await ActivityBar.hide()
  await ActivityBar.show()
}
