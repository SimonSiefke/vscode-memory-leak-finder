import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

export const getObjectStackTraces = async (session, objectGroup, objectId) => {
  const stackTraces = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
const detachedRoots = this

const getStackTrace = (detachedNode) => {
  return detachedNode.___stackTrace || ''
}

const getStackTraces = (detachedNodes) => {
  const stackTraces = []
  for(const detachedNode of detachedNodes){
    const stackTrace = getStackTrace(detachedNode)
    stackTraces.push(stackTrace)
  }
  return stackTraces
}

const stackTraces = getStackTraces(detachedRoots)
return stackTraces
}`,
    objectId,
    returnByValue: true,
    objectGroup,
  })
  return stackTraces
}
