export const run = async ({ TitleBar }) => {
  await TitleBar.showMenu('File')
  await TitleBar.hideMenu('File')
}
