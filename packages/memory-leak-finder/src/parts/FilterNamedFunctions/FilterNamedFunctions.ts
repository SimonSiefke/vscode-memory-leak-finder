import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const filterNamedFunctions = async (session: Session, objects: any, objectGroup: string) => {
  const fnResult2 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const functions = this

  const getDescription = fn => {
    try {
      return fn?.toString()
    } catch {
      return 'toString error'
    }
  }


  const isNative = fn => {
    const description = getDescription(fn)
    return description.includes('[native code]')
  }

  const isClass = fn => {
    const description = getDescription(fn)
    return description.startsWith('class')
  }

  const isNormalFunction = fn => {
    if(isNative(fn)){
      return false
    }
    if(isClass(fn)){
      return false
    }
    return true
  }

  const normalFunctions = functions.filter(isNormalFunction)
  return normalFunctions
}`,
    objectId: objects.objects.objectId,
    returnByValue: false,
    objectGroup,
  })
  return fnResult2
}
