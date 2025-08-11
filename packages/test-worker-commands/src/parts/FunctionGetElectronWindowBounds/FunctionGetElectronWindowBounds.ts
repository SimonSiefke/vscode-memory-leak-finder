export const code = `function (){
  const electron = this
  const { BrowserWindow } = electron
  const browserWindows = BrowserWindow.getAllWindows()
  const first = browserWindows[0]
  const bounds = first.getBounds()
  return bounds
}`
