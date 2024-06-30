import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

/**
 *
 * @param {any} session
 * @returns {Promise<any>}
 */
export const getWidgets = async (session, objectGroup) => {
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

  const isWidgetConstructor = (object) => {
    return object && typeof object === 'function' && object.name === 'Widget'
  }

  const widgetConstructor = objects.find(isWidgetConstructor)
  if(!widgetConstructor){
    throw new Error('no widget constructor found')
  }

  const isWidget = object => {
    return object && object instanceof widgetConstructor
  }

  const instances = objects.filter(isWidget)
  return instances
}`,
    objectId: objects.objects.objectId,
    returnByValue: false,
    objectGroup,
  })
  return fnResult1
}
