import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getConstructorInstances = async (
  session: Session,
  objectGroup: string,
  constructorName: string,
  allowFunctions = false,
): Promise<any> => {
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
  const objects = this;

  const constructorName = '${constructorName}'
  const allowFunctions = ${allowFunctions}

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
  const widgetConstructor = allowFunctions ? possibleConstructors[0] : possibleConstructors.find(isClass)

  if(!widgetConstructor){
    throw new Error('no ${constructorName} constructor found')
  }

  const isWidget = object => {
    return object && object instanceof widgetConstructor;
  }

  const instances = objects.filter(isWidget);
  return instances
}`,
    objectGroup,
    objectId: objects.objects.objectId,
    returnByValue: false,
  })
  return fnResult1
}
