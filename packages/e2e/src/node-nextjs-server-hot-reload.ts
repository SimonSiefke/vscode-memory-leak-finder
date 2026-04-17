import assert from 'node:assert'
import type { TestContext } from '../types.js'

export const skip = false

export const requiresNetwork = true

const originalPageContent = `export default function Page() {
  return <main>next fixture works</main>
}
`

const updatedPageContent = `export default function Page() {
  return <main>next fixture updated</main>
}
`

const updatePageContent = async (Editor: TestContext['Editor'], content: string): Promise<void> => {
  await Editor.open('page.js')
  await Editor.deleteAll()
  await Editor.type(content)
  await Editor.save({ viaKeyBoard: true })
}

const assertBodyContains = async (ExternalRuntime: TestContext['ExternalRuntime'], expectedText: string): Promise<void> => {
  let lastStatus = 0
  let lastBody = ''
  for (let attempt = 0; attempt < 120; attempt++) {
    const response = await ExternalRuntime.request('/')
    lastStatus = response.status
    lastBody = await response.text()
    if (response.ok && lastBody.includes(expectedText)) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  assert.fail(`Timed out waiting for page body to contain ${JSON.stringify(expectedText)}. Last status: ${lastStatus}. Last body: ${lastBody}`)
}

export const setup = async ({ Editor, Explorer, ExternalRuntime, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([])
  await Explorer.focus()

  const { inspectPort, serverPort } = await ExternalRuntime.createPorts()
  await ExternalRuntime.startExternalRuntime({
    command: 'node',
    args: [`--inspect=127.0.0.1:${inspectPort}`, 'start-next.cjs', 'dev'],
    cwd: 'next-app',
    setupCommands: [
      {
        command: 'npx',
        args: [
          '--yes',
          'create-next-app@latest',
          'next-app',
          '--yes',
          '--use-npm',
          '--js',
          '--app',
          '--eslint',
          '--no-tailwind',
          '--skip-install',
        ],
      },
      {
        command: 'npm',
        args: ['install', '--package-lock-only'],
        cwd: 'next-app',
      },
      {
        command: 'npm',
        args: ['ci'],
        cwd: 'next-app',
      },
    ],
    setupFiles: [
      {
        name: 'next-app/app/page.js',
        content: originalPageContent,
      },
      {
        name: 'next-app/app/health/route.js',
        content: `export function GET() {
  return Response.json({ ok: true })
}
`,
      },
      {
        name: 'next-app/start-next.cjs',
        content: `process.env.HOSTNAME = '127.0.0.1'
process.env.NEXT_TELEMETRY_DISABLED = '1'
process.env.PORT = process.env.MEMORY_LEAK_FINDER_SERVER_PORT

require('next/dist/bin/next')
`,
      },
    ],
    inspectPort,
    runtimeName: 'node',
    serverPort,
  })
}

export const run = async ({ Editor, ExternalRuntime }: TestContext): Promise<void> => {
  await assertBodyContains(ExternalRuntime, 'next fixture works')

  await updatePageContent(Editor, updatedPageContent)
  await assertBodyContains(ExternalRuntime, 'next fixture updated')

  await updatePageContent(Editor, originalPageContent)
  await assertBodyContains(ExternalRuntime, 'next fixture works')
}

export const teardown = async ({ Editor, ExternalRuntime, Workspace }: TestContext): Promise<void> => {
  await ExternalRuntime.dispose()
  await Editor.closeAll()
  await Workspace.setFiles([])
}
