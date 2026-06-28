import type { Session } from '../Session/Session.ts'
import type { ScriptMap } from '../Types/Types.ts'

export interface IScriptHandler {
  readonly scriptMap: ScriptMap
  readonly start: (session: Session) => Promise<void>
  readonly stop: (session: Session) => Promise<void>
}
