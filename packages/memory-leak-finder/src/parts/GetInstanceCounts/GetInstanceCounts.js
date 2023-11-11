import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

export const getInstanceCounts = async (session, objectGroup) => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Object,
    includeCommandLineAPI: true,
    returnByValue: false,
    objectGroup,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    prototypeObjectId: prototypeDescriptor.objectId,
    objectGroup,
  })
  const fnResult1 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const objects = this

  const nativeConstructors = [
    Object,
    Array,
    Function,
    Set,
    Map,
    WeakMap,
    WeakSet,
    RegExp,
    Node,
    HTMLScriptElement,
    DOMRectReadOnly,
    DOMRect,
    HTMLHtmlElement,
    Node,
    DOMTokenList,
    HTMLUListElement,
    HTMLStyleElement,
    HTMLDivElement,
    HTMLCollection,
    FocusEvent,
    Promise,
    HTMLLinkElement,
    HTMLLIElement,
    HTMLAnchorElement
  ]

  const isInstance = (object) => {
    return object && !nativeConstructors.includes(object.constructor)
  }

  const instances = objects.filter(isInstance)

  const map = new Map()

  for(const instance of instances){
    if(map.has(instance.constructor)){
      map.set(instance.constructor, map.get(instance.constructor) + 1)
    } else {
      map.set(instance.constructor, 1)
    }
  }

  const array = []

  for(const [instanceConstructor, count] of map.entries()){
    array.push({
      name: instanceConstructor.name,
      count,
    })
  }

  return array
}`,
    objectId: objects.objects.objectId,
    returnByValue: true,
    objectGroup,
  })
  return fnResult1
}
