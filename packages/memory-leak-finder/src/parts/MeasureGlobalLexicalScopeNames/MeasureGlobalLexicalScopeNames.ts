import * as GetGlobalLexicalScopeNames from '../GetGlobalLexicalScopeNames/GetGlobalLexicalScopeNames.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import type { Session } from '../Session/Session.ts'

export const id = MeasureId.GlobalLexicalScopeNames

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  return [session]
}

export const start = (session: Session) => {
  return GetGlobalLexicalScopeNames.getGlobalLexicalScopeNames(session)
}

export const stop = (session: Session) => {
  return GetGlobalLexicalScopeNames.getGlobalLexicalScopeNames(session)
}

export const compare = (before, after) => {
  return {
    after,
    before,
  }
}

export const isLeak = () => {
  return false
}
