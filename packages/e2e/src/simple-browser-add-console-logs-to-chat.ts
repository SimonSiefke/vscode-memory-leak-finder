import type { TestContext } from '../types.js'

export const skip = 1

const testId = 'simple-browser-add-console-logs-to-chat'
const testUrl = 'http://localhost:3001/console-errors.html'
const consoleErrorText = 'Simple browser console error for chat context'

const errorPageHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Console Errors</title>
  </head>
  <body>
    <h1>Console Error Page</h1>
    <script>
      setTimeout(() => {
        console.error('${consoleErrorText}')
      }, 1000)
      setTimeout(() => {
        throw new Error('Simple browser uncaught error for chat context')
      }, 1500)
    </script>
  </body>
</html>`

export const setup = async ({ SideBar, ChatEditor, SimpleBrowser, Workspace, Editor }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: errorPageHtml,
      name: 'console-errors.html',
    },
  ])
  await SideBar.hide()
  await ChatEditor.open()
  await Editor.splitRight()
  // @ts-ignore
  await SimpleBrowser.createWorkspaceFileServer({
    id: testId,
    port: 3001,
    relativePath: 'console-errors.html',
  })
  await SimpleBrowser.show({
    url: testUrl,
  })
  // TODO
  // @ts-ignore
  // await Editor.closeOthers()
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Console Error Page',
  })
}

export const run = async ({ ChatEditor, SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.addConsoleLogsToChat()
  await ChatEditor.shouldHaveAttachedContextHoverText(consoleErrorText)
}

export const teardown = async ({ Editor, SimpleBrowser }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SimpleBrowser.disposeMockServer({
    id: testId,
  })
}
