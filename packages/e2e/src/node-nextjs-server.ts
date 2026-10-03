import assert from 'node:assert'
import type { TestContext } from '../types.js'

export const skip = true

export const requiresNetwork = true

export const setup = async ({ Editor, Explorer, ExternalRuntime, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([])
  await Explorer.focus()

  const { inspectPort, serverPort } = await ExternalRuntime.createPorts()
  await ExternalRuntime.startExternalRuntime({
    args: [`--inspect=127.0.0.1:${inspectPort}`, 'start-next.cjs', 'dev'],
    command: 'node',
    cwd: 'next-app',
    inspectPort,
    runtimeName: 'node',
    serverPort,
    setupCommands: [
      {
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
        command: 'npx',
      },
      {
        args: ['install', '--package-lock-only'],
        command: 'npm',
        cwd: 'next-app',
      },
      {
        args: ['ci'],
        command: 'npm',
        cwd: 'next-app',
      },
    ],
    setupFiles: [
      {
        content: `export default function Page() {
  return <main>next fixture works</main>
}
`,
        name: 'next-app/app/page.js',
      },
      {
        content: `export function GET() {
  return Response.json({ ok: true })
}
`,
        name: 'next-app/app/health/route.js',
      },
      {
        content: `process.env.HOSTNAME = '127.0.0.1'
process.env.NEXT_TELEMETRY_DISABLED = '1'
process.env.PORT = process.env.MEMORY_LEAK_FINDER_SERVER_PORT

require('next/dist/bin/next')
`,
        name: 'next-app/start-next.cjs',
      },
    ],
  })
}

export const run = async ({ ExternalRuntime }: TestContext): Promise<void> => {
  const response = await ExternalRuntime.request('/')
  assert.strictEqual(response.ok, true)

  const body = await response.text()
  assert.match(body, /next fixture works/)
}

export const teardown = async ({ Editor, ExternalRuntime, Workspace }: TestContext): Promise<void> => {
  await ExternalRuntime.dispose()
  await Editor.closeAll()
  await Workspace.setFiles([])
}
