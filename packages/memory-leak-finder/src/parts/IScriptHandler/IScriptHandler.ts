import type { Session } from '../Session/Session.ts'

export interface IScriptHandler {
  readonly scriptMap: Record<string, any>
  readonly start: (session: Session) => Promise<void>
  readonly stop: (session: Session) => Promise<void>
}
