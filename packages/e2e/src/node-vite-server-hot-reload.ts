import assert from 'node:assert'
import type { TestContext } from '../types.js'

export const skip = false

export const requiresNetwork = true

const originalAppContent = `function App() {
  return <main>vite fixture works</main>
}

export default App
`

const updatedAppContent = `function App() {
  return <main>vite fixture updated</main>
}

export default App
`

const updateAppContent = async (Workspace: TestContext['Workspace'], content: string): Promise<void> => {
  await Workspace.add({
    name: 'vite-app/src/App.tsx',
    content,
  })
}

const assertResponseContains = async (
  ExternalRuntime: TestContext['ExternalRuntime'],
  path: string,
  expectedText: string,
): Promise<void> => {
  let lastStatus = 0
  let lastBody = ''
  for (let attempt = 0; attempt < 120; attempt++) {
    const response = await ExternalRuntime.request(path)
    lastStatus = response.status
    lastBody = await response.text()
    if (response.ok && lastBody.includes(expectedText)) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  assert.fail(
    `Timed out waiting for ${JSON.stringify(path)} body to contain ${JSON.stringify(expectedText)}. Last status: ${lastStatus}. Last body: ${lastBody}`,
  )
}

export const setup = async ({ Editor, Explorer, ExternalRuntime, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([])
  await Explorer.focus()

  const { inspectPort, serverPort } = await ExternalRuntime.createPorts()
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
        args: ['--yes', 'create-vite@latest', 'vite-app', '--template', 'react-ts'],
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
        name: 'vite-app/src/App.tsx',
        content: originalAppContent,
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

export const run = async ({ ExternalRuntime, Workspace }: TestContext): Promise<void> => {
  await assertResponseContains(ExternalRuntime, '/src/App.tsx', 'vite fixture works')

  await updateAppContent(Workspace, updatedAppContent)
  await assertResponseContains(ExternalRuntime, '/src/App.tsx', 'vite fixture updated')

  await updateAppContent(Workspace, originalAppContent)
  await assertResponseContains(ExternalRuntime, '/src/App.tsx', 'vite fixture works')
}

export const teardown = async ({ Editor, ExternalRuntime, Workspace }: TestContext): Promise<void> => {
  await ExternalRuntime.dispose()
  await Editor.closeAll()
  await Workspace.setFiles([])
}
