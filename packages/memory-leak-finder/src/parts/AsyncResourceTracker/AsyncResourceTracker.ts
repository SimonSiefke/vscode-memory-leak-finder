import type { Session } from '../Session/Session.ts'
import type { Dynamic } from '../Types/Types.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

const startExpression = `(() => {
  globalThis.___memoryLeakFinderAsyncHook?.disable()
  delete globalThis.___memoryLeakFinderAsyncHook
  delete globalThis.___memoryLeakFinderAsyncResources
  const getBuiltinModule = globalThis.process?.getBuiltinModule
  const asyncHooks = typeof getBuiltinModule === 'function'
    ? getBuiltinModule.call(globalThis.process, 'node:async_hooks')
    : typeof globalThis.require === 'function'
      ? globalThis.require('node:async_hooks')
      : undefined
  if (!asyncHooks) {
    throw new Error('active-async-resources-with-stack-traces requires a Node target with async_hooks')
  }
  const resources = new Map()
  const hook = asyncHooks.createHook({
    init(asyncId, type, triggerAsyncId) {
      const holder = {}
      Error.captureStackTrace(holder, hook.callbacks?.init)
      const stackTrace = String(holder.stack || new Error().stack || '')
        .split('\n')
        .slice(1)
        .filter(line => !line.includes('node:internal/async_hooks'))
      resources.set(asyncId, { asyncId, stackTrace, triggerAsyncId, type })
    },
    destroy(asyncId) {
      resources.delete(asyncId)
    },
    promiseResolve(asyncId) {
      resources.delete(asyncId)
    },
  })
  globalThis.___memoryLeakFinderAsyncResources = resources
  globalThis.___memoryLeakFinderAsyncHook = hook
  hook.enable()
})()`

const stopExpression = `(() => {
  const hook = globalThis.___memoryLeakFinderAsyncHook
  const resources = globalThis.___memoryLeakFinderAsyncResources
  hook?.disable()
  try {
    if (!(resources instanceof Map)) {
      return []
    }
    const groups = new Map()
    for (const item of resources.values()) {
      const key = JSON.stringify([item.type, item.stackTrace])
      let group = groups.get(key)
      if (!group) {
        group = { asyncIds: [], count: 0, stackTrace: item.stackTrace, triggerAsyncIds: [], type: item.type }
        groups.set(key, group)
      }
      group.count++
      if (group.asyncIds.length < 20) group.asyncIds.push(item.asyncId)
      if (group.triggerAsyncIds.length < 20 && !group.triggerAsyncIds.includes(item.triggerAsyncId)) {
        group.triggerAsyncIds.push(item.triggerAsyncId)
      }
    }
    return [...groups.values()].sort((a, b) => b.count - a.count || a.type.localeCompare(b.type))
  } finally {
    delete globalThis.___memoryLeakFinderAsyncHook
    delete globalThis.___memoryLeakFinderAsyncResources
  }
})()`

const cleanupExpression = `(() => {
  globalThis.___memoryLeakFinderAsyncHook?.disable()
  delete globalThis.___memoryLeakFinderAsyncHook
  delete globalThis.___memoryLeakFinderAsyncResources
})()`

export const start = async (session: Session): Promise<void> => {
  await DevtoolsProtocolRuntime.evaluate(session, { expression: startExpression, returnByValue: true })
}

export const stop = async (session: Session): Promise<readonly Dynamic[]> => {
  return await DevtoolsProtocolRuntime.evaluate(session, { expression: stopExpression, returnByValue: true })
}

export const cleanup = async (session: Session): Promise<void> => {
  await DevtoolsProtocolRuntime.evaluate(session, { expression: cleanupExpression, returnByValue: true })
}
