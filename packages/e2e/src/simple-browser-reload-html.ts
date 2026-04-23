import type { TestContext } from '../types.ts'

export const skip = 1

const testId = 'simple-browser-reload-html'
const testUrl = 'http://localhost:3001/index.html'

const initialHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Initial Page</title>
  </head>
  <body>
    <h1>Initial Content</h1>
  </body>
</html>`

const updatedHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Updated Page</title>
  </head>
  <body>
    <h1>Updated Content</h1>
  </body>
</html>`

export const setup = async ({ Editor, Explorer, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: initialHtml,
      name: 'index.html',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('index.html')
  // @ts-ignore
  await SimpleBrowser.createWorkspaceFileServer({
    id: testId,
    port: 3001,
    relativePath: 'index.html',
  })
}

export const run = async ({ Editor, SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.show({
    url: testUrl,
  })
  // @ts-ignore
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Initial Content',
  })

  await Editor.open('index.html')
  await Editor.deleteAll()
  await Editor.type(updatedHtml)
  await Editor.save({
    viaKeyBoard: true,
  })

  // @ts-ignore

  await SimpleBrowser.reload()
  // @ts-ignore

  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Updated Content',
  })
  await Editor.closeAll()
}

export const teardown = async ({ Editor, SimpleBrowser }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SimpleBrowser.disposeMockServer({
    id: testId,
  })
}
