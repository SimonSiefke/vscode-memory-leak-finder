import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export interface ObjectUrlCounts {
  readonly created: number
  readonly revoked: number
  readonly unreleased: number
}

const startExpression = `(() => {
  globalThis.___memoryLeakFinderObjectUrlTracker?.dispose()

  const url = globalThis.URL
  if (typeof url?.createObjectURL !== 'function' || typeof url?.revokeObjectURL !== 'function') {
    throw new Error('object-url-count requires URL.createObjectURL and URL.revokeObjectURL')
  }

  const originalCreateObjectURL = url.createObjectURL
  const originalRevokeObjectURL = url.revokeObjectURL
  const activeUrls = new Set()
  let created = 0
  let revoked = 0

  function createObjectURL(...args) {
    created++
    const objectUrl = originalCreateObjectURL.apply(this, args)
    activeUrls.add(objectUrl)
    return objectUrl
  }

  function revokeObjectURL(...args) {
    revoked++
    activeUrls.delete(args[0])
    return originalRevokeObjectURL.apply(this, args)
  }

  url.createObjectURL = createObjectURL
  url.revokeObjectURL = revokeObjectURL

  globalThis.___memoryLeakFinderObjectUrlTracker = {
    dispose() {
      if (url.createObjectURL === createObjectURL) {
        url.createObjectURL = originalCreateObjectURL
      }
      if (url.revokeObjectURL === revokeObjectURL) {
        url.revokeObjectURL = originalRevokeObjectURL
      }
      delete globalThis.___memoryLeakFinderObjectUrlTracker
    },
    getCounts() {
      return { created, revoked, unreleased: activeUrls.size }
    },
  }
})()`

const getCountsExpression = `(() => {
  const tracker = globalThis.___memoryLeakFinderObjectUrlTracker
  return tracker ? tracker.getCounts() : { created: 0, revoked: 0, unreleased: 0 }
})()`

const cleanupExpression = `(() => {
  globalThis.___memoryLeakFinderObjectUrlTracker?.dispose()
})()`

export const start = async (session: Session): Promise<void> => {
  await DevtoolsProtocolRuntime.evaluate(session, { expression: startExpression, returnByValue: true })
}

export const getCounts = async (session: Session): Promise<ObjectUrlCounts> => {
  return DevtoolsProtocolRuntime.evaluate(session, { expression: getCountsExpression, returnByValue: true })
}

export const cleanup = async (session: Session): Promise<void> => {
  await DevtoolsProtocolRuntime.evaluate(session, { expression: cleanupExpression, returnByValue: true })
}
