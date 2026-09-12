import type { Session } from '../Session/Session.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectUrlTracker from '../ObjectUrlTracker/ObjectUrlTracker.ts'
import type { ObjectUrlCounts } from '../ObjectUrlTracker/ObjectUrlTracker.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.ObjectUrlCount

export const targets = [TargetId.Browser]

export const create = (session: Session) => {
  return [session]
}

const emptyCounts: ObjectUrlCounts = {
  created: 0,
  revoked: 0,
  unreleased: 0,
}

export const start = async (session: Session): Promise<ObjectUrlCounts> => {
  await ObjectUrlTracker.start(session)
  return emptyCounts
}

export const stop = (session: Session): Promise<ObjectUrlCounts> => {
  return ObjectUrlTracker.getCounts(session)
}

export const releaseResources = async (_session: Session): Promise<void> => {}

export const compare = (before: ObjectUrlCounts, after: ObjectUrlCounts): ObjectUrlCounts => {
  return {
    created: after.created - before.created,
    revoked: after.revoked - before.revoked,
    unreleased: after.unreleased - before.unreleased,
  }
}

export const isLeak = (result: ObjectUrlCounts): boolean => {
  return result.unreleased > 0
}

export const summary = ({ created, revoked, unreleased }: ObjectUrlCounts): string => {
  return `Object URLs: ${created} created, ${revoked} revoked, ${unreleased} unreleased`
}
