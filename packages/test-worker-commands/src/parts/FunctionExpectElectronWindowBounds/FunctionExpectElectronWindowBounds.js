// export const code = `function (x){
//   const electron = this
//   const { BrowserWindow } = electron
//   const browserWindows = BrowserWindow.getAllWindows()
//   const first = browserWindows[0]
//   const isAttached = first.webContents.debugger.isAttached()
//   return {x}
// }`
export const code = `async function (targetId){
  const electron = this
  const { webContents } = electron
  const targetWebContents = webContents.fromDevToolsTargetId(targetId)
  if(!targetWebContents){
    throw new Error('webcontents not found')
  }
  await new Promise(resolve => setTimeout(resolve, 500))
  const title = targetWebContents.getTitle()
  return title
}`
