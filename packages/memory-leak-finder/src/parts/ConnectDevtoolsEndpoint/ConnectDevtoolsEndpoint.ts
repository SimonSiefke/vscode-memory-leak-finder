import type { Session } from '../Session/Session.ts'
import { setTimeout as delay } from 'node:timers/promises'
import { createConnection } from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const waitFor = async <T>(description: string, probe: () => Promise<T | undefined | false>, timeout = 60000): Promise<T> => {
  const deadline = Date.now() + timeout
  let lastError: unknown
  while (Date.now() < deadline) {
    try {
      const value = await probe()
      if (value !== undefined && value !== false) return value
    } catch (error) {
      lastError = error
    }
    await delay(20)
  }
  throw new Error(`Timed out waiting for ${description}${lastError ? `: ${String(lastError)}` : ''}`)
}

export const connectTarget = async (port: number, inspector = false): Promise<Session> => {
  const url = await waitFor('VS Code DevTools endpoint', async () => {
    const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(2000) })
    const targets = (await response.json()) as { type: string; url: string; webSocketDebuggerUrl: string }[]
    return targets.find((entry) => inspector || (entry.type === 'page' && entry.url.includes('workbench')))?.webSocketDebuggerUrl
  })
  const rpc = await createConnection(url, { connectionTimeoutMs: 10000, requestTimeoutMs: 120000 })
  // Direct target connections do not attach another Target session, but the page APIs
  // use this string to identify their locators and isolated execution context.
  rpc.sessionId = ''
  rpc.canUseIdleCallback = !inspector
  return rpc
}

export const evaluate = <T = any>(session: Session, expression: string): Promise<T> =>
  DevtoolsProtocolRuntime.evaluate(session, { expression, awaitPromise: true, returnByValue: true })

export const waitReady = async (session: Session, workspace: boolean): Promise<void> => {
  await waitFor('visible workbench', async () =>
    (await evaluate(session, `!!document.querySelector('.monaco-workbench .part.editor')?.getBoundingClientRect().width`)) ? true : false,
  )
  if (workspace)
    await waitFor('startup text editor', async () =>
      (await evaluate(
        session,
        `(document.querySelector('.monaco-editor .view-lines')?.textContent || '').replace(/\\u00a0/g, ' ').includes('large needle')`,
      ))
        ? true
        : false,
    )
}
