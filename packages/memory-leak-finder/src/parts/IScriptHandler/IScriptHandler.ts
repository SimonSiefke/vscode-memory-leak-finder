import type { Session } from '../Session/Session.ts'

export interface IScriptHandler {
  readonly start: (session: Session) => Promise<void>
  readonly stop: (session: Session) => Promise<void>
  readonly scriptMap: Record<string, any>
}
