export const skip = process.platform === 'darwin'

export const setup = async ({ TitleBar }) => {
  await TitleBar.showMenuFile()
}

export const run = async ({ TitleBar }) => {
  await TitleBar.showMenuEdit()
  await TitleBar.showMenuFile()
}
