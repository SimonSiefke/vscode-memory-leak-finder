import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import type { Session } from '../Session/Session.ts'
import type { TrackedAllocationByteResult } from '../CompareTrackedAllocationBytes/CompareTrackedAllocationBytes.ts'
import * as CompareTrackedAllocationBytes from '../CompareTrackedAllocationBytes/CompareTrackedAllocationBytes.ts'
import * as GetTrackedAllocationBytes from '../GetTrackedAllocationBytes/GetTrackedAllocationBytes.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.TrackedAllocationBytes
export const targets = [TargetId.Browser]

export const create = (session: Session) => [session, ScriptHandler.create()]

export const start = async (session: Session, scriptHandler: IScriptHandler) => {
  await scriptHandler.start(session)
  // Distinguish a valid zero-allocation interval from missing instrumentation.
  await GetTrackedAllocationBytes.getTrackedAllocationBytes(session)
  await GetTrackedAllocationBytes.resetTrackedAllocationBytes(session)
  return { trackedAllocationBytes: {} }
}

export const stop = async (session: Session, scriptHandler: IScriptHandler) => {
  try {
    const trackedAllocationBytes = await GetTrackedAllocationBytes.getTrackedAllocationBytes(session)
    return { scriptMap: scriptHandler.scriptMap, trackedAllocationBytes }
  } finally {
    await scriptHandler.stop(session)
  }
}

export const compare = CompareTrackedAllocationBytes.compareTrackedAllocationBytes
export const isLeak = () => false

export const summary = (rows: readonly TrackedAllocationByteResult[]): string => {
  const bytes = rows.reduce((sum, row) => sum + row.estimatedBytes, 0)
  const unknown = rows.reduce((sum, row) => sum + row.unknownCount, 0)
  const lines = [
    `Estimated tracked allocation bytes: ${bytes} B (${unknown} unknown-size values)`,
    'estimated bytes | created | unknown size | type | location',
  ]
  for (const row of rows.slice(0, 10)) {
    lines.push(
      `${row.estimatedBytes} | ${row.createdCount} | ${row.unknownCount} | ${row.originalType} | ${row.originalLocation || row.location}`,
    )
  }
  return lines.join('\n')
}

export const releaseResources = async (session: Session, scriptHandler: IScriptHandler): Promise<void> => {
  try {
    await scriptHandler.stop(session)
  } catch {
    // The debugger may already be disconnected during failure cleanup.
  }
}
