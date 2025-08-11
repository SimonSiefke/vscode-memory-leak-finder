import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

/**
 *
 * @param {any} session
 * @returns {Promise<any>}
 */
export const getConstructorInstances = async (session, objectGroup, constructorName) => {
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
  const objects = this;

  const constructorName = '${constructorName}'

  const RE_CLASS = /^\s*class\s+/;

  const isClass = (object) => {
    return object.toString().startsWith('class ')
  }

  const isFunction = object => {
    return object && typeof object === 'function'
  }

  const isPossibleWidgetConstructor = (object) => {
    return object.name === constructorName;
  }

  const functions = objects.filter(isFunction);
  const possibleConstructors = functions.filter(isPossibleWidgetConstructor);
  const widgetConstructor = possibleConstructors.find(isClass);

  if(!widgetConstructor){
    throw new Error('no \${constructorName} constructor found')
  }

  const isWidget = object => {
    return object && object instanceof widgetConstructor;
  }

  const instances = objects.filter(isWidget);
  return instances
}`,
    objectId: objects.objects.objectId,
    returnByValue: false,
    objectGroup,
  })
  return fnResult1
}
