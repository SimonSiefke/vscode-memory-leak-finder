import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export interface SymbolWithStackTrace {
  readonly description: string
  readonly name: string
  readonly registered: boolean
  readonly stackTrace: string
}

export const getSymbolsWithStackTraces = async (session: Session, objectGroup: string): Promise<readonly SymbolWithStackTrace[]> => {
  return DevtoolsProtocolRuntime.evaluate(session, {
    expression: `(()=>{
const records = globalThis.___symbolStackTraceRecords || []
const symbols = []
for (const record of records) {
  const symbol = record.registered ? record.reference : record.reference.deref()
  if (symbol !== undefined) {
    symbols.push({
      description: symbol.description ?? '',
      name: String(symbol),
      registered: record.registered,
      stackTrace: record.stackTrace,
    })
  }
}
return symbols
})()`,
    objectGroup,
    returnByValue: true,
  })
}
