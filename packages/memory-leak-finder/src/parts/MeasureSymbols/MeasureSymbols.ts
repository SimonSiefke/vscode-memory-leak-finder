import type { Session } from '../Session/Session.ts'
import * as GetSymbols from '../GetSymbols/GetSymbols.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.Symbols

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session: Session, objectGroup: string) => {
  return GetSymbols.getSymbols(session, objectGroup)
}

export const stop = (session: Session, objectGroup: string) => {
  return GetSymbols.getSymbols(session, objectGroup)
}

export const compare = (before, after) => {
  return {
    after,
    before,
  }
}

export const isLeak = (before, after) => {
  return false
}
