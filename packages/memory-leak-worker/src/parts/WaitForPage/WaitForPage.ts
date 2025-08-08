import * as DevtoolsTargetType from '../DevtoolsTargetType/DevtoolsTargetType.ts'
import * as SessionState from '../SessionState/SessionState.ts'
import * as TargetState from '../TargetState/TargetState.ts'

export const waitForPage = async ({ index }: { readonly index: number }): Promise<any> => {
  const target = await TargetState.waitForTarget({
    type: DevtoolsTargetType.Page,
    index,
  })
  const session = SessionState.getSession(target.sessionId!)
  const allSessions = SessionState.getAllSessions()
  console.log({ allSessions })
  const rpc = session!.rpc
  return {
    sessionId: target.sessionId!,
    targetId: target.targetId,
    rpc,
  }
}
