export const run = async ({ TitleBar }) => {
  await TitleBar.showMenu()
  await TitleBar.hideMenu()
}
