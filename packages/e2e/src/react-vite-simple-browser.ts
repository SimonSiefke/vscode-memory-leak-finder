import assert from 'node:assert'
import type { TestContext } from '../types.js'

export const skip = true

export const requiresNetwork = true

const helloWorldText = 'Hello World'
const browserUrlPattern = /^http:\/\/127\.0\.0\.1:\d+\//

let testUrl = ''

const getIndexHtml = (): string => {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React CDN Vite Fixture</title>
    <link rel="stylesheet" href="/src/style.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
      import React from 'https://esm.sh/react@19.2.0'
      import { createRoot } from 'https://esm.sh/react-dom@19.2.0/client'
      import { renderHelloWorld } from '/src/app.js'

      renderHelloWorld({
        React,
        createRoot,
        root: document.getElementById('root'),
      })
    </script>
  </body>
</html>
`
}

const getAppSource = (): string => {
  return `export const renderHelloWorld = ({ React, createRoot, root }) => {
  if (!root) {
    throw new Error('Expected root element')
  }

  createRoot(root).render(React.createElement('h1', undefined, '${helloWorldText}'))
}
`
}

const getStyleSource = (): string => {
  return `body {
  margin: 0;
  font-family: system-ui, sans-serif;
}

h1 {
  margin: 24px;
}
`
}

export const setup = async ({ Editor, Explorer, ExternalRuntime, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([])
  await Explorer.focus()

  const { inspectPort, serverPort } = await ExternalRuntime.createPorts()
  testUrl = `http://127.0.0.1:${serverPort}/`

  await ExternalRuntime.startExternalRuntime({
    command: 'node',
    args: [
      `--inspect=127.0.0.1:${inspectPort}`,
      './node_modules/vite/bin/vite.js',
      '--host',
      '127.0.0.1',
      '--port',
      String(serverPort),
      '--strictPort',
    ],
    cwd: 'vite-app',
    healthPath: '/health.txt',
    setupCommands: [
      {
        command: 'npx',
        args: ['--yes', 'create-vite@latest', 'vite-app', '--template', 'vanilla'],
      },
      {
        command: 'npm',
        args: ['install', '--package-lock-only'],
        cwd: 'vite-app',
      },
      {
        command: 'npm',
        args: ['ci'],
        cwd: 'vite-app',
      },
    ],
    setupFiles: [
      {
        name: 'vite-app/index.html',
        content: getIndexHtml(),
      },
      {
        name: 'vite-app/src/app.js',
        content: getAppSource(),
      },
      {
        name: 'vite-app/src/style.css',
        content: getStyleSource(),
      },
      {
        name: 'vite-app/public/health.txt',
        content: 'ok\n',
      },
    ],
    inspectPort,
    runtimeName: 'node',
    serverPort,
  })
}

export const run = async ({ ExternalRuntime, SimpleBrowser }: TestContext): Promise<void> => {
  const response = await ExternalRuntime.request('/health.txt')
  assert.strictEqual(response.ok, true)

  await SimpleBrowser.show({
    url: testUrl,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: helloWorldText,
    urlPattern: browserUrlPattern,
  })
}

export const teardown = async ({ Editor, ExternalRuntime, Workspace }: TestContext): Promise<void> => {
  await ExternalRuntime.dispose()
  await Editor.closeAll()
  await Workspace.setFiles([])
}
