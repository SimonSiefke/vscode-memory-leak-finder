import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetDisposableStores from '../GetDisposableStores/GetDisposableStores.js'

export const startTrackingDisposableStores = async (session, objectGroup) => {
  const fnResult1 = await GetDisposableStores.getDisposableStores(session, objectGroup)
  await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const disposableStores = this

  if(disposableStores.length === 0){
    throw new Error("no disposable stores found")
  }

  const first = disposableStores[0]
  const prototype = first.constructor

  if(!prototype.prototype.add){
    throw new Error("no disposable add function found")
  }

  globalThis.___disposableStoreOriginalAdd = prototype.prototype.add

  // based on https://github.com/sindresorhus/callsites
  const callsites = () => {
    const _prepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = (_, stack) => stack;
    const stack = new Error().stack.slice(2);
    Error.prepareStackTrace = _prepareStackTrace;
    return stack.join('\\n')
  }

  prototype.prototype.add = function(...args) {
    const stackTrace = callsites()
    this.___stackTraces ||= []
    this.___stackTraces.push(stackTrace)
    return globalThis.___disposableStoreOriginalAdd.apply(this, args)
  }
}`,
    objectId: fnResult1.objectId,
    returnByValue: false,
    objectGroup,
  })
}
