import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import * as GetStoredPromiseReferences from '../GetStoredPromiseReferences/GetStoredPromiseReferences.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.StoredPromiseReferences

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

const getAndRelease = async (session: Session, objectGroup: string) => {
  try {
    return await GetStoredPromiseReferences.getStoredPromiseReferences(session, objectGroup)
  } finally {
    await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  }
}

export const start = (session: Session, objectGroup: string) => {
  return getAndRelease(session, objectGroup)
}

export const stop = (session: Session, objectGroup: string) => {
  return getAndRelease(session, objectGroup)
}

export const compare = (before: readonly Dynamic[], after: readonly Dynamic[], context: Dynamic) => {
  const beforeCounts = new Map(before.map((item) => [`${item.owner}\u0000${item.property}`, item.count]))
  const added = []
  for (const item of after) {
    const beforeCount = beforeCounts.get(`${item.owner}\u0000${item.property}`) || 0
    const delta = item.count - beforeCount
    if (delta >= context.runs) {
      added.push({
        ...item,
        delta,
      })
    }
  }
  return added.toSorted((left, right) => right.delta - left.delta)
}

export const isLeak = (result: readonly Dynamic[]) => {
  return result.length > 0
}

export const releaseResources = async (session: Session, objectGroup: string) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}
