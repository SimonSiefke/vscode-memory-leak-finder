import * as GetGlobalLexicalScopeNames from '../GetGlobalLexicalScopeNames/GetGlobalLexicalScopeNames.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.GlobalLexicalScopeNames

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session) => {
  return [session]
}

export const start = (session) => {
  return GetGlobalLexicalScopeNames.getGlobalLexicalScopeNames(session)
}

export const stop = (session) => {
  return GetGlobalLexicalScopeNames.getGlobalLexicalScopeNames(session)
}

export const compare = (before, after) => {
  return {
    before,
    after,
  }
}

export const isLeak = () => {
  return false
}
