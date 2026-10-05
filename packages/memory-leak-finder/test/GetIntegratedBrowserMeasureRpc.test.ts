import { expect, test } from '@jest/globals'
import { getIntegratedBrowserMeasureRpc } from '../src/parts/GetIntegratedBrowserMeasureRpc/GetIntegratedBrowserMeasureRpc.ts'

test('getIntegratedBrowserMeasureRpc - selects new http page target', async () => {
  const calls: readonly unknown[] = []
  const mutableCalls = calls as unknown[]
  const rpc = {
    callbacks: {},
    connectionClosed: () => false,
    listeners: {},
    onceListeners: {},
    dispose() {},
    invoke(method: string, params: unknown) {
      mutableCalls.push([method, params])
      if (method === 'Target.getTargets') {
        return {
          result: {
            targetInfos: [
              {
                targetId: 'existing-target',
                title: 'Workbench',
                type: 'page',
                url: 'vscode-file://workbench',
              },
              {
                targetId: 'react-target',
                title: 'React Vite Fixture',
                type: 'page',
                url: 'http://127.0.0.1:3000/',
              },
            ],
          },
        }
      }
      if (method === 'Target.attachToTarget') {
        return {
          result: {
            sessionId: 'react-session',
          },
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
    invokeWithSession(sessionId: string, method: string, params: unknown) {
      mutableCalls.push([sessionId, method, params])
      if (sessionId === 'react-session' && method === 'Target.setAutoAttach') {
        return {
          result: {},
        }
      }
      throw new Error(`unexpected session method ${method}`)
    },
    off() {},
    on() {},
    once() {
      return Promise.resolve({})
    },
  }

  const sessionRpc = await getIntegratedBrowserMeasureRpc(rpc, ['existing-target'])

  expect(sessionRpc.sessionId).toBe('react-session')
  expect(mutableCalls).toEqual([
    ['Target.getTargets', undefined],
    [
      'Target.attachToTarget',
      {
        flatten: true,
        targetId: 'react-target',
      },
    ],
    [
      'react-session',
      'Target.setAutoAttach',
      {
        autoAttach: true,
        flatten: true,
        waitForDebuggerOnStart: false,
      },
    ],
  ])
})

test('getIntegratedBrowserMeasureRpc - errors when no new http page exists', async () => {
  const rpc = {
    callbacks: {},
    connectionClosed: () => false,
    listeners: {},
    onceListeners: {},
    dispose() {},
    invoke(method: string) {
      if (method === 'Target.getTargets') {
        return {
          result: {
            targetInfos: [
              {
                targetId: 'existing-target',
                title: 'Existing',
                type: 'page',
                url: 'http://127.0.0.1:3000/',
              },
            ],
          },
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
    invokeWithSession() {
      throw new Error('unexpected session method')
    },
    off() {},
    on() {},
    once() {
      return Promise.resolve({})
    },
  }

  await expect(getIntegratedBrowserMeasureRpc(rpc, ['existing-target'])).rejects.toThrow(
    'Failed to find new integrated browser HTTP(S) page target',
  )
})
