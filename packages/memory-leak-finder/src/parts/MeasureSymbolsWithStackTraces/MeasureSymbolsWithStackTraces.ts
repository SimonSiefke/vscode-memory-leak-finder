import type { Session } from '../Session/Session.ts'
import * as ForceGarbageCollection from '../ForceGarbageCollection/ForceGarbageCollection.ts'
import * as GetSymbolsWithStackTraces from '../GetSymbolsWithStackTraces/GetSymbolsWithStackTraces.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'
import * as StartTrackingSymbolStackTraces from '../StartTrackingSymbolStackTraces/StartTrackingSymbolStackTraces.ts'
import * as StopTrackingSymbolStackTraces from '../StopTrackingSymbolStackTraces/StopTrackingSymbolStackTraces.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.SymbolsWithStackTraces

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  return [session, ObjectGroupId.create()]
}

export const start = async (session: Session, objectGroup: string) => {
  await ForceGarbageCollection.forceGarbageCollection(session)
  await StartTrackingSymbolStackTraces.startTrackingSymbolStackTraces(session, objectGroup)
  return []
}

export const stop = async (session: Session, objectGroup: string) => {
  await ForceGarbageCollection.forceGarbageCollection(session)
  try {
    return await GetSymbolsWithStackTraces.getSymbolsWithStackTraces(session, objectGroup)
  } finally {
    await StopTrackingSymbolStackTraces.stopTrackingSymbolStackTraces(session, objectGroup)
  }
}

export { compareSymbolsWithStackTraces as compare } from '../CompareSymbolsWithStackTraces/CompareSymbolsWithStackTraces.ts'

export const isLeak = (result: readonly unknown[]): boolean => {
  return result.length > 0
}

export const releaseResources = async (session: Session, objectGroup: string): Promise<void> => {
  try {
    await StopTrackingSymbolStackTraces.stopTrackingSymbolStackTraces(session, objectGroup)
  } finally {
    await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  }
}
