export const code = `async function (targetId){
  const electron = this
  const { webContents, BrowserWindow } = electron
  const targetWebContents = webContents.fromDevToolsTargetId(targetId)
  if(!targetWebContents){
    throw new Error('webcontents not found')
  }
  const browserWindow = BrowserWindow.fromWebContents(targetWebContents)
  if(!browserWindow){
    throw new Error('browser window not found')
  }
  if(!browserWindow.isMinimized()){
    throw new Error('expected browser window to be minimized')
  }
}`
