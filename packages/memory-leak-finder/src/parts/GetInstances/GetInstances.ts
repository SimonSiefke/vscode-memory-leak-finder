import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getInstances = async (session: Session, objectGroup: string) => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Object,
    objectGroup,
    returnByValue: false,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    objectGroup,
    prototypeObjectId: prototypeDescriptor.objectId,
  })
  const fnResult1 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const objects = this

  const nativeConstructors = [
    globalThis.Object,
    globalThis.Array,
    globalThis.Function,
    globalThis.Set,
    globalThis.Map,
    globalThis.WeakMap,
    globalThis.WeakSet,
    globalThis.RegExp,
    globalThis.Node,
    globalThis.HTMLScriptElement,
    globalThis.DOMRectReadOnly,
    globalThis.DOMRect,
    globalThis.HTMLHtmlElement,
    globalThis.Node,
    globalThis.DOMTokenList,
    globalThis.HTMLUListElement,
    globalThis.HTMLStyleElement,
    globalThis.HTMLDivElement,
    globalThis.HTMLCollection,
    globalThis.FocusEvent,
    globalThis.Promise,
    globalThis.HTMLLinkElement,
    globalThis.HTMLLIElement,
    globalThis.HTMLAnchorElement,
    globalThis.HTMLSpanElement,
    globalThis.ArrayBuffer,
    globalThis.Uint16Array,
    globalThis.HTMLLabelElement,
    globalThis.TrustedTypePolicy,
    globalThis.Uint8Array,
    globalThis.Uint32Array,
    globalThis.HTMLHeadingElement,
    globalThis.MediaQueryList,
    globalThis.HTMLDocument,
    globalThis.TextDecoder,
    globalThis.TextEncoder,
    globalThis.HTMLInputElement,
    globalThis.HTMLCanvasElement,
    globalThis.HTMLIFrameElement,
    globalThis.Int32Array,
    globalThis.CSSStyleDeclaration
  ].filter(Boolean)

  const isNativeConstructor = object => {
    return nativeConstructors.includes(object.constructor) ||
           object.constructor.name === 'AsyncFunction' ||
           object.constructor.name === 'GeneratorFunction' ||
           object.constructor.name === 'AsyncGeneratorFunction'
  }

  const isInstance = (object) => {
    return object && !isNativeConstructor(object)
  }

  const instances = objects.filter(isInstance)
  return instances
}`,
    objectGroup,
    objectId: objects.objects.objectId,
    returnByValue: false,
  })
  return fnResult1
}
