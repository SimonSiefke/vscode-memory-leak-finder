import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { install } from '../LongAnimationFramesTracker/LongAnimationFramesTracker.ts'
import * as Diagnostic from '../RuntimePerformanceDiagnostic/RuntimePerformanceDiagnostic.ts'
import type { Session } from '../Session/Session.ts'
import * as TargetId from '../TargetId/TargetId.ts'
export const id = 'longAnimationFrames'
export const targets = [TargetId.Browser]
const key = '__memoryLeakFinderLongAnimationFrames'
export const create = Diagnostic.create
export const start = (session: Session) => Diagnostic.start(session, key, install)
export const stop = async (session: Session) => {
  // Wait for the frame in progress to end so its entry is queued before the snapshot.
  await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `globalThis[${JSON.stringify(key)}]?.flush?.()`,
    awaitPromise: true,
    returnByValue: true,
  })
  return Diagnostic.stop(session, key)
}
export const releaseResources = (session: Session) => Diagnostic.release(session, key)
export const compare = Diagnostic.compare
export const isLeak = Diagnostic.isLeak
export const summary = Diagnostic.summary
