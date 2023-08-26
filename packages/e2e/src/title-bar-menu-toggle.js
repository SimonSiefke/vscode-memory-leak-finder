export const skip = true

export const run = async ({ TitleBar }) => {
  await TitleBar.showMenuFile()
  await TitleBar.hideMenuFile()
}
