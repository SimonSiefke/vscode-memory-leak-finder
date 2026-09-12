import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const startTrackingSymbolStackTraces = async (session: Session, objectGroup: string): Promise<void> => {
  await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `(()=>{
const OriginalSymbol = globalThis.Symbol

if (globalThis.___trackedSymbol) {
  throw new Error('Symbol stack trace tracking is already active')
}

const records = []
const registeredSymbols = new Set()

const callsites = () => {
  const originalPrepareStackTrace = Error.prepareStackTrace
  try {
    Error.prepareStackTrace = (_, stack) => stack
    return new Error().stack.slice(3).join('\\n')
  } finally {
    Error.prepareStackTrace = originalPrepareStackTrace
  }
}

const trackSymbol = (symbol, registered) => {
  if (registered) {
    if (registeredSymbols.has(symbol)) {
      return symbol
    }
    registeredSymbols.add(symbol)
  }
  records.push({
    reference: registered ? symbol : new WeakRef(symbol),
    registered,
    stackTrace: callsites(),
  })
  return symbol
}

const createSymbol = (target, thisArgument, argumentsList) => {
  return trackSymbol(Reflect.apply(target, thisArgument, argumentsList), false)
}

const getRegisteredSymbol = (target, thisArgument, argumentsList) => {
  return trackSymbol(Reflect.apply(target, thisArgument, argumentsList), true)
}

const trackedSymbolFor = new Proxy(OriginalSymbol.for, {
  apply: getRegisteredSymbol,
})
const trackedSymbol = new Proxy(OriginalSymbol, {
  apply: createSymbol,
  get(target, property, receiver) {
    if (property === 'for') {
      return trackedSymbolFor
    }
    return Reflect.get(target, property, receiver)
  },
})

globalThis.___originalSymbol = OriginalSymbol
globalThis.___symbolStackTraceRecords = records
globalThis.___trackedSymbol = trackedSymbol
globalThis.Symbol = trackedSymbol
})()`,
    objectGroup,
  })
}
