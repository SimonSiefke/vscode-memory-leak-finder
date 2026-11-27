import { expect, test } from '@jest/globals'
import * as DiffWorkerProbe from '../src/parts/DiffWorkerProbe/DiffWorkerProbe.ts'

const diffInstance = {
  exports: ['memory', 'computeDiff', 'init', 'inputBuffer', '__wbindgen_malloc'],
  memoryBytes: 1_179_648,
}

const otherInstance = {
  exports: ['memory', 'onig_new', 'onig_search'],
  memoryBytes: 65_536,
}

const createBrowserRpc = (workers: Record<string, { instances?: any[]; attachError?: string; title: string }>) => {
  const calls: string[] = []
  const sessionTargets = new Map<string, string>()
  let nextSession = 0
  const rpc = {
    calls,
    async invoke(method: string, params: any) {
      calls.push(method)
      switch (method) {
        case 'Target.getTargets':
          return {
            result: {
              targetInfos: [
                { targetId: 'page', title: 'Visual Studio Code', type: 'page', url: 'vscode-file://vscode-app/workbench.html' },
                ...Object.entries(workers).map(([targetId, worker]) => ({
                  targetId,
                  title: worker.title,
                  type: 'worker',
                  url: `blob:${targetId}`,
                })),
              ],
            },
          }
        case 'Target.attachToTarget': {
          const worker = workers[params.targetId]
          if (worker.attachError) {
            return { error: { message: worker.attachError } }
          }
          const sessionId = `session-${nextSession++}`
          sessionTargets.set(sessionId, params.targetId)
          return { result: { sessionId } }
        }
        case 'Target.detachFromTarget':
          sessionTargets.delete(params.sessionId)
          return { result: {} }
        default:
          throw new Error(`unexpected ${method}`)
      }
    },
    async invokeWithSession(sessionId: string, method: string) {
      calls.push(`${sessionId}:${method}`)
      const targetId = sessionTargets.get(sessionId)
      if (!targetId) {
        throw new Error(`unknown session ${sessionId}`)
      }
      switch (method) {
        case 'Runtime.evaluate':
          return { result: { result: { objectId: 'prototype' } } }
        case 'Runtime.queryObjects':
          return { result: { objects: { objectId: 'instances' } } }
        case 'Runtime.callFunctionOn':
          return { result: { result: { value: workers[targetId].instances ?? [] } } }
        case 'Runtime.releaseObjectGroup':
          return { result: {} }
        default:
          throw new Error(`unexpected ${method}`)
      }
    },
    sessionTargets,
  }
  return rpc
}

test('detects the WebAssembly diff module in the editor worker and detaches', async () => {
  const rpc = createBrowserRpc({
    editor: { instances: [diffInstance], title: 'editorWorkerService' },
    textmate: { instances: [otherInstance], title: 'TextMateWorker' },
  })
  const states = await DiffWorkerProbe.getDiffWorkerStates(rpc)
  expect(states.map((state) => state.title)).toEqual(['editorWorkerService', 'TextMateWorker'])
  expect(DiffWorkerProbe.isWasmDiffLoaded(states)).toBe(true)
  expect(rpc.sessionTargets.size).toBe(0)
  expect(rpc.calls.filter((call) => call.endsWith('Runtime.releaseObjectGroup'))).toHaveLength(2)
  expect(rpc.calls).not.toContain('Target.attachToTarget:page')
})

test('does not accept unrelated WebAssembly modules or a worker without instances', async () => {
  const rpc = createBrowserRpc({
    editor: { instances: [], title: 'editorWorkerService' },
    textmate: { instances: [otherInstance], title: 'TextMateWorker' },
  })
  const states = await DiffWorkerProbe.getDiffWorkerStates(rpc)
  expect(DiffWorkerProbe.isWasmDiffLoaded(states)).toBe(false)
})

test('keeps attach failures as diagnostics', async () => {
  const rpc = createBrowserRpc({
    gone: { attachError: 'No target with given id found', title: 'editorWorkerService' },
  })
  const states = await DiffWorkerProbe.getDiffWorkerStates(rpc)
  expect(states).toEqual([
    {
      error: 'Target.attachToTarget failed: No target with given id found',
      instances: [],
      title: 'editorWorkerService',
      url: 'blob:gone',
    },
  ])
  expect(DiffWorkerProbe.isWasmDiffLoaded(states)).toBe(false)
})

test('requires a browser rpc', async () => {
  await expect(DiffWorkerProbe.getDiffWorkerStates(undefined)).rejects.toThrow('browser rpc is required')
})
