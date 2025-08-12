// export const code = `function (x){
//   const electron = this
//   const { BrowserWindow } = electron
//   const browserWindows = BrowserWindow.getAllWindows()
//   const first = browserWindows[0]
//   const isAttached = first.webContents.debugger.isAttached()
//   return {x}
// }`
export const code = `function (targetId){
  const electron = this
  const { webContents } = electron
  const targetWebContents = webContents.fromDevToolsTargetId(targetId)
  if(!targetWebContents){
    throw new Error('webcontents not found')
  }
  const title = targetWebContents.getTitle()
  return title
}`
