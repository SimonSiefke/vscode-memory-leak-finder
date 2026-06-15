import { expect, test } from '@jest/globals'
import { waitForSession } from '../src/parts/WaitForSession/WaitForSession.ts'

interface DevtoolsCall {
  method: string
  params?: unknown
}

interface TargetInfo {
  attached?: boolean
  targetId: string
  title?: string
  type: string
  url?: string
}

class NoErrorThrownError extends Error {}

const getError = async (fn: () => Promise<unknown>): Promise<Error> => {
  try {
    await fn()
    throw new NoErrorThrownError()
  } catch (error) {
    return error as Error
  }
}

const createBrowserRpc = ({
  attachError,
  sessionId = 'manual-session',
  targets,
}: {
  attachError?: Error
  sessionId?: string
  targets: readonly TargetInfo[]
}) => {
  const calls: DevtoolsCall[] = []
  const listeners = Object.create(null)
  return {
    callbacks: Object.create(null),
    calls,
    async dispose() {},
    invoke(method: string, params?: unknown): Promise<unknown> {
      calls.push({ method, params })
      if (method === 'Target.setAutoAttach') {
        return Promise.resolve({ result: {} })
      }
      if (method === 'Target.getTargets') {
        return Promise.resolve({ result: { targetInfos: targets } })
      }
      if (method === 'Target.attachToTarget') {
        if (attachError) {
          return Promise.resolve({ error: { message: attachError.message } })
        }
        return Promise.resolve({ result: { sessionId } })
      }
      return Promise.resolve({ result: {} })
    },
    invokeWithSession() {
      return Promise.resolve({ result: {} })
    },
    listeners,
    off(event: string, listener: unknown) {
      if (listeners[event] === listener) {
        delete listeners[event]
      }
    },
    on(event: string, listener: unknown) {
      listeners[event] = listener
    },
    once() {
      return Promise.resolve({
        params: {
          sessionId: 'unused-session',
          targetInfo: {
            targetId: 'unused-target',
            type: 'page',
          },
        },
      })
    },
  }
}

test('waitForSession - attaches to existing page target after auto attach timeout', async () => {
  const browserRpc = createBrowserRpc({
    targets: [
      {
        attached: false,
        targetId: 'page-1',
        title: 'Visual Studio Code',
        type: 'page',
        url: 'vscode-file://vscode-app/index.html',
      },
    ],
  })

  const result = await waitForSession(browserRpc, 0)

  expect(result.sessionId).toBe('manual-session')
  expect(result.targetId).toBe('page-1')
  expect(browserRpc.calls).toContainEqual({
    method: 'Target.attachToTarget',
    params: {
      flatten: true,
      targetId: 'page-1',
    },
  })
})

test('waitForSession - includes target details when no page target is available', async () => {
  const browserRpc = createBrowserRpc({
    targets: [
      {
        attached: true,
        targetId: 'browser-1',
        title: '',
        type: 'browser',
        url: '',
      },
      {
        attached: false,
        targetId: 'tab-1',
        title: 'Visual Studio Code',
        type: 'tab',
        url: 'devtools://devtools',
      },
    ],
  })

  const error = await getError(() => waitForSession(browserRpc, 0))

  expect(error.message).toContain('Failed to attach to page after 0ms')
  expect(error.message).toContain('No Target.attachedToTarget event was received after Target.setAutoAttach')
  expect(error.message).toContain('browser targetId=browser-1 attached=true url="<empty>" title="<empty>"')
  expect(error.message).toContain('tab targetId=tab-1 attached=false url="devtools://devtools" title="Visual Studio Code"')
})

test('waitForSession - includes fallback attach error', async () => {
  const browserRpc = createBrowserRpc({
    attachError: new Error('Target closed'),
    targets: [
      {
        attached: true,
        targetId: 'page-1',
        title: 'Visual Studio Code',
        type: 'page',
        url: 'vscode-file://vscode-app/index.html',
      },
    ],
  })

  const error = await getError(() => waitForSession(browserRpc, 0))

  expect(error.message).toContain('page targetId=page-1 attached=true url="vscode-file://vscode-app/index.html" title="Visual Studio Code"')
  expect(error.message).toContain('Fallback Target.attachToTarget failed: Target closed')
})
