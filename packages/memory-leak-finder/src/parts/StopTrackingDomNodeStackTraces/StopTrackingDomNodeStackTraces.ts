import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const stopTrackingDomNodeStackTraces = async (session: Session, objectGroup: string): Promise<void> => {
  await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `(()=>{
document.createElement = globalThis.___originalCreateElement

delete globalThis.___originalCreateElement

})()
undefined
`,
    objectGroup,
  })
}
