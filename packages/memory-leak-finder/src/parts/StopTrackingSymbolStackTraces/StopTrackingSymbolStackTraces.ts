import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const stopTrackingSymbolStackTraces = async (session: Session, objectGroup: string): Promise<void> => {
  await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `(()=>{
if (globalThis.___trackedSymbol && globalThis.Symbol === globalThis.___trackedSymbol) {
  globalThis.Symbol = globalThis.___originalSymbol
}
delete globalThis.___originalSymbol
delete globalThis.___symbolStackTraceRecords
delete globalThis.___trackedSymbol
})()`,
    objectGroup,
  })
}
