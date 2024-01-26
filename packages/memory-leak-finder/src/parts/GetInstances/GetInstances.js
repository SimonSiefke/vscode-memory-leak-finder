import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

export const getInstances = async (session, objectGroup) => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Object,
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
    HTMLAnchorElement,
    HTMLSpanElement
  ]

  const isNativeConstructor = object => {
    return nativeConstructors.includes(object.constructor) || object.constructor.name === 'AsyncFunction'
  }

  const isInstance = (object) => {
    return object && !isNativeConstructor(object)
  }

  const instances = objects.filter(isInstance)
  return instances
}`,
    objectId: objects.objects.objectId,
    returnByValue: false,
    objectGroup,
  })
  return fnResult1
}
