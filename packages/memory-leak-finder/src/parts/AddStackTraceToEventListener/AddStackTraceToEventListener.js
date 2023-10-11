import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as RemoveServerUrlPrefix from '../RemoveServerUrlPrefix/RemoveServerUrlPrefix.js'
import * as SplitLines from '../SplitLines/SplitLines.js'

export const addStackTraceToEventListener = async (session, eventListener) => {
  if (!eventListener.objectId) {
    throw new Error('object id is required')
  }
  const result = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `
function () {
const eventListener = this
console.log(globalThis.___eventListenerStackTraces)
for(const stackTrace of globalThis.___eventListenerStackTraces){
  if(stackTrace.args[1] === eventListener){
    return stackTrace.stackTrace
  }
}
return ''
}`,
    objectId: eventListener.objectId,
    returnByValue: true,
  })
  const baseResult = result
  const stackTrace = RemoveServerUrlPrefix.removeServerUrlPrefix(baseResult)
  const { stack: initialStackTrace, ...rest } = eventListener
  const stackTraceLines = SplitLines.splitLines(stackTrace)
  const fullStackLines = [...initialStackTrace, ...stackTraceLines]
  return {
    ...rest,
    stack: fullStackLines,
  }
}
