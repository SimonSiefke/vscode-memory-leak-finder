import type { Session } from '../Session/Session.ts'
import * as Diagnostic from '../RuntimePerformanceDiagnostic/RuntimePerformanceDiagnostic.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import { install } from '../SynchronousFileSystemTracker/SynchronousFileSystemTracker.ts'
export const id = 'synchronousFileSystem'
export const targets = [TargetId.Node]
const key = '__memoryLeakFinderSynchronousFileSystem'
export const create = Diagnostic.create
export const start = (session: Session) => Diagnostic.start(session, key, install)
export const stop = (session: Session) => Diagnostic.stop(session, key)
export const releaseResources = (session: Session) => Diagnostic.release(session, key)
export const compare = Diagnostic.compare
export const isLeak = Diagnostic.isLeak
export const summary = Diagnostic.summary
