import { resolveTrackedLocationSourceMaps } from '../ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts'
import type { Session } from '../Session/Session.ts'
import * as Diagnostic from '../RuntimePerformanceDiagnostic/RuntimePerformanceDiagnostic.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import { install } from '../SynchronousDomReadCountWithStackTracesTracker/SynchronousDomReadCountWithStackTracesTracker.ts'
export const id = 'synchronousDomReadCountWithStackTraces'
export const targets = [TargetId.Browser]
const key = '__memoryLeakFinderSynchronousDomReadCountWithStackTraces'
export const create = Diagnostic.create
export const start = (session: Session) => Diagnostic.start(session, key, install)
export const stop = (session: Session) => Diagnostic.stop(session, key)
export const releaseResources = (session: Session) => Diagnostic.release(session, key)
export const compare = async (before: any, after: any) => {
  const rows = after.rows || []
  const locations = new Set<string>()
  for (const row of rows) {
    for (const line of row.name.split('\n').slice(1)) {
      const match = line.match(/(?:\(|at )((?:file:|vscode-file:|https?:|\/).+?:\d+:\d+)\)?$/)
      if (match) locations.add(match[1])
    }
  }
  const resolved = await resolveTrackedLocationSourceMaps([...locations], undefined)
  return Diagnostic.compare(before, {
    ...after,
    rows: rows.map((row: any) => {
      let name = row.name
      for (const [location, source] of Object.entries(resolved))
        if (source.originalLocation) name = name.replaceAll(location, source.originalLocation)
      return { ...row, name, generatedStack: row.name }
    }),
  })
}
export const isLeak = Diagnostic.isLeak
export const summary = Diagnostic.summary
