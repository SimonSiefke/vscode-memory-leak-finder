export const skip = process.platform === 'darwin'

export const run = async ({ TitleBar }) => {
  await TitleBar.showMenuFile()
  await TitleBar.hideMenuFile()
}
