const getConstructorNameFunction = 'function(){ return this && this.constructor ? this.constructor.name : "" }'

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

const queryInstancesExpression = (constructorName: string): string => {
  return `queryInstances(globalThis[${JSON.stringify(constructorName)}])`
}

const invokeQueryObjects = async (rpc: any, params: { objectGroup?: string; prototypeObjectId: string }) => {
  const constructorName = await getConstructorNameFromPrototype(rpc, params.prototypeObjectId)
  const rawResult = await rpc.invoke('Runtime.evaluate', {
    doNotPauseOnExceptionsAndMuteConsole: true,
    expression: queryInstancesExpression(constructorName),
    includeCommandLineAPI: true,
    objectGroup: params.objectGroup,
    returnByValue: false,
  })
  if (rawResult?.result?.wasThrown) {
    const description = rawResult?.result?.result?.description || `queryInstances failed for ${constructorName}`
    throw new Error(description)
  }
  const remoteObject = getRemoteObject(rawResult)
  if (!remoteObject) {
    throw new Error(`Failed to query Bun instances for ${constructorName}`)
  }
  return createResultEnvelope({
    objects: remoteObject,
  })
}

export const createBunWebkitRpc = async (rpc: any): Promise<any> => {
  await initializeBunInspector(rpc)
  return {
    ...rpc,
    invoke(method: string, params: any) {
      switch (method) {
        case 'Runtime.enable': {
          return Promise.resolve(createResultEnvelope({}))
        }
        case 'Runtime.queryObjects': {
          return invokeQueryObjects(rpc, params)
        }
        default: {
          return rpc.invoke(method, params)
        }
      }
    },
  }
}
