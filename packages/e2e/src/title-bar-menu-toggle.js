export const skip = true

export const beforeSetup = async ({ writeSettings }) => {
  await writeSettings({
    'window.titleBarStyle': 'custom',
  })
}

export const run = async ({ TitleBar }) => {
  await TitleBar.showMenu()
  await TitleBar.hideMenu()
}
