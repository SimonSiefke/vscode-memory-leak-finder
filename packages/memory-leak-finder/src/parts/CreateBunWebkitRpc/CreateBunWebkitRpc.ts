const getConstructorNameFunction = 'function(){ return this && this.constructor ? this.constructor.name : "" }'

interface SyntheticQueryObject {
  readonly expression: string
  readonly objectGroup?: string
}

let nextSyntheticObjectId = 0

const createResultEnvelope = (result: any) => {
  return { result }
}

const getRemoteObject = (rawResult: any) => {
  return rawResult?.result?.result
}

const getResultValue = (rawResult: any) => {
  return getRemoteObject(rawResult)?.value
}

const initializeBunInspector = async (rpc: any): Promise<void> => {
  await rpc.invoke('Inspector.enable', {})
  await rpc.invoke('Runtime.enable', {})
  await rpc.invoke('Console.enable', {})
  await rpc.invoke('Inspector.initialized', {})
}

const getConstructorNameFromPrototype = async (rpc: any, prototypeObjectId: string): Promise<string> => {
  const rawResult = await rpc.invoke('Runtime.callFunctionOn', {
    functionDeclaration: getConstructorNameFunction,
    objectId: prototypeObjectId,
    returnByValue: true,
  })
  if (rawResult?.result?.wasThrown) {
    throw new Error(`Failed to determine Bun constructor name from prototype ${prototypeObjectId}`)
  }
  const constructorName = getResultValue(rawResult)
  if (!constructorName) {
    throw new Error(`Failed to determine Bun constructor name from prototype ${prototypeObjectId}`)
  }
  return constructorName
}

const getSyntheticObjectId = (): string => {
  const value = nextSyntheticObjectId
  nextSyntheticObjectId++
  return `bun-query-objects-${value}`
}

const createSyntheticRemoteObject = (objectId: string) => {
  return {
    className: 'Array',
    description: 'Array',
    objectId,
    subtype: 'array',
    type: 'object',
  }
}

const createCallFunctionOnEnvelope = (objectId: string) => {
  return createResultEnvelope({
    result: {
      ...createSyntheticRemoteObject(objectId),
    },
    wasThrown: false,
  })
}

const queryInstancesExpression = (constructorName: string): string => {
  return `queryInstances(globalThis[${JSON.stringify(constructorName)}])`
}

const getConstructorNameMatch = (functionDeclaration: string): string | undefined => {
  const match = functionDeclaration.match(/const constructorName = ['"]([^'"]+)['"]/)
  return match?.[1]
}

const getAllowFunctions = (functionDeclaration: string): boolean => {
  const match = functionDeclaration.match(/const allowFunctions = (true|false)/)
  return match?.[1] === 'true'
}

const isConstructorInstancesFunction = (functionDeclaration: string): boolean => {
  return functionDeclaration.includes('possibleConstructors') && functionDeclaration.includes('widgetConstructor')
}

const createConstructorInstancesExpression = (constructorName: string, allowFunctions: boolean): string => {
  return `(() => {
  const constructorName = ${JSON.stringify(constructorName)}
  const allowFunctions = ${allowFunctions}
  const isClass = (object) => {
    return object.toString().startsWith('class ')
  }
  const isFunction = object => {
    return object && typeof object === 'function'
  }
  const isPossibleWidgetConstructor = (object) => {
    return object.name === constructorName;
  }
  const functions = queryInstances(Function).filter(isFunction)
  const possibleConstructors = functions.filter(isPossibleWidgetConstructor)
  const widgetConstructor = allowFunctions ? possibleConstructors[0] : possibleConstructors.find(isClass)
  if(!widgetConstructor){
    throw new Error('no ${constructorName} constructor found')
  }
  return queryInstances(widgetConstructor)
})()`
}

const removeSyntheticObjectGroup = (syntheticObjects: Map<string, SyntheticQueryObject>, objectGroup: string | undefined): void => {
  if (!objectGroup) {
    return
  }
  for (const [objectId, value] of syntheticObjects) {
    if (value.objectGroup === objectGroup) {
      syntheticObjects.delete(objectId)
    }
  }
}

const invokeQueryObjects = async (
  rpc: any,
  syntheticObjects: Map<string, SyntheticQueryObject>,
  params: { objectGroup?: string; prototypeObjectId: string },
) => {
  const constructorName = await getConstructorNameFromPrototype(rpc, params.prototypeObjectId)
  const syntheticObjectId = getSyntheticObjectId()
  syntheticObjects.set(syntheticObjectId, {
    expression: queryInstancesExpression(constructorName),
    objectGroup: params.objectGroup,
  })
  return createResultEnvelope({
    objects: createSyntheticRemoteObject(syntheticObjectId),
  })
}

const invokeSyntheticQueryObjectsFunction = async (
  rpc: any,
  syntheticObjects: Map<string, SyntheticQueryObject>,
  value: SyntheticQueryObject,
  params: { awaitPromise?: boolean; functionDeclaration: string; objectGroup?: string; returnByValue?: boolean },
) => {
  const constructorName = getConstructorNameMatch(params.functionDeclaration)
  const allowFunctions = getAllowFunctions(params.functionDeclaration)
  const expression =
    value.expression === queryInstancesExpression('Object') && constructorName && isConstructorInstancesFunction(params.functionDeclaration)
      ? createConstructorInstancesExpression(constructorName, allowFunctions)
      : `(${params.functionDeclaration}).call(${value.expression})`
  if (!params.returnByValue) {
    const syntheticObjectId = getSyntheticObjectId()
    syntheticObjects.set(syntheticObjectId, {
      expression,
      objectGroup: params.objectGroup,
    })
    return createCallFunctionOnEnvelope(syntheticObjectId)
  }
  return rpc.invoke('Runtime.evaluate', {
    awaitPromise: params.awaitPromise,
    doNotPauseOnExceptionsAndMuteConsole: true,
    expression,
    includeCommandLineAPI: true,
    objectGroup: params.objectGroup,
    returnByValue: params.returnByValue,
  })
}

export const createBunWebkitRpc = async (rpc: any): Promise<any> => {
  await initializeBunInspector(rpc)
  const syntheticObjects = new Map<string, SyntheticQueryObject>()
  return {
    ...rpc,
    invoke(method: string, params: any) {
      switch (method) {
        case 'Runtime.enable': {
          return Promise.resolve(createResultEnvelope({}))
        }
        case 'Runtime.queryObjects': {
          return invokeQueryObjects(rpc, syntheticObjects, params)
        }
        case 'Runtime.callFunctionOn': {
          const syntheticObject = syntheticObjects.get(params.objectId)
          if (syntheticObject) {
            return invokeSyntheticQueryObjectsFunction(rpc, syntheticObjects, syntheticObject, params)
          }
          return rpc.invoke(method, params)
        }
        case 'Runtime.releaseObjectGroup': {
          removeSyntheticObjectGroup(syntheticObjects, params?.objectGroup)
          return rpc.invoke(method, params)
        }
        default: {
          return rpc.invoke(method, params)
        }
      }
    },
  }
}
