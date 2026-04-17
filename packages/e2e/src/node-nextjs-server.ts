import assert from 'node:assert'
import type { TestContext } from '../types.js'

export const skip = false

export const requiresNetwork = true

export const setup = async ({ Editor, Explorer, ExternalRuntime, Terminal, Workspace }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Editor.closeAll()
  await Workspace.setFiles([])
  await Explorer.focus()

  await Terminal.show({
    waitForReady: true,
  })
  await Terminal.execute('npx --yes create-next-app@latest next-app --yes --use-npm --js --app --eslint --no-tailwind --skip-install', {
    waitForFile: 'next-app/package.json',
  })

  await Workspace.add({
    name: 'next-app/app/page.js',
    content: `export default function Page() {
  return <main>next fixture works</main>
}
`,
  })
  await Workspace.add({
    name: 'next-app/app/health/route.js',
    content: `export function GET() {
  return Response.json({ ok: true })
}
`,
  })
  await Workspace.add({
    name: 'next-app/start-next.cjs',
    content: `process.env.HOSTNAME = '127.0.0.1'
process.env.NEXT_TELEMETRY_DISABLED = '1'
process.env.PORT = process.env.MEMORY_LEAK_FINDER_SERVER_PORT

require('next/dist/bin/next')
`,
  })

  await Terminal.execute('cd next-app && nvm use 24 && npm install', {
    waitForFile: 'next-app/node_modules/next/package.json',
  })

  const { inspectPort, serverPort } = await ExternalRuntime.createPorts()
  await ExternalRuntime.startExternalRuntime({
    command: 'node',
    args: [`--inspect=127.0.0.1:${inspectPort}`, 'start-next.cjs', 'dev'],
    cwd: 'next-app',
    inspectPort,
    runtimeName: 'node',
    serverPort,
  })
}

export const run = async ({ ExternalRuntime }: TestContext): Promise<void> => {
  const response = await ExternalRuntime.request('/')
  assert.strictEqual(response.ok, true)

  const body = await response.text()
  assert.match(body, /next fixture works/)
}

export const teardown = async ({ Editor, ExternalRuntime, Terminal, Workspace }: TestContext): Promise<void> => {
  await ExternalRuntime.dispose()
  await Terminal.killAll()
  await Editor.closeAll()
  await Workspace.setFiles([])
}
