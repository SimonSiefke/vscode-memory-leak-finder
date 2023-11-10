import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.js'
import * as GetObjectId from '../GetObjectId/GetObjectId.js'
import * as CombineInstanceCountsAndObjectIds from '../CombineInstanceCountsAndObjectIds/CombineInstanceCountsAndObjectIds.js'

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
    FocusEvent
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

  return map

}`,
    objectId: objects.objects.objectId,
    returnByValue: false,
    objectGroup,
  })
  const fnResult2 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const map = this
  const array = []

  for(const [instanceConstructor, count] of map.entries()){
    array.push({
      name: instanceConstructor.name,
      count,
    })
  }

  return array
}`,
    objectId: fnResult1.objectId,
    returnByValue: true,
    objectGroup,
  })
  const fnResult3 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const map = this
  const array = []

  for(const [instanceConstructor, count] of map.entries()){
    array.push(instanceConstructor)
  }

  return array
}`,
    objectId: fnResult1.objectId,
    returnByValue: false,
    objectGroup,
  })

  const fnResult4 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: fnResult3.objectId,
    ownProperties: true,
  })
  const descriptorValues = GetDescriptorValues.getDescriptorValues(fnResult4)
  const objectIds = descriptorValues.map(GetObjectId.getObjectId)

  const combined = CombineInstanceCountsAndObjectIds.combineInstanceCountsAndObjectIds(fnResult2, objectIds)
  return combined
}
