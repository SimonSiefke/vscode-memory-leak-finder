import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.js'
import * as GetObjectId from '../GetObjectId/GetObjectId.js'
import * as CombineInstanceCountsAndObjectIds from '../CombineInstanceCountsAndObjectIds/CombineInstanceCountsAndObjectIds.js'

export const getInstanceCounts = async (session) => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Object,
    includeCommandLineAPI: true,
    returnByValue: false,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    prototypeObjectId: prototypeDescriptor.objectId,
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
    HTMLScriptElement
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
      map.set(instance.constructor, 0)
    }
  }

  return map

}`,
    objectId: objects.objects.objectId,
    returnByValue: false,
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
  })
  const fnResult3 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const map = this
  return [...map.keys()]
}`,
    objectId: fnResult1.objectId,
    returnByValue: false,
  })

  const fnResult4 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: fnResult3.objectId,
    ownProperties: true,
  })
  const descriptorValues = GetDescriptorValues.getDescriptorValues(fnResult4)
  const objectIds = descriptorValues.map(GetObjectId.getObjectId)
  const combined = CombineInstanceCountsAndObjectIds.combineInstanceCountsAndObjectIds(fnResult2, objectIds)
  console.log({ combined })
  return combined
}
