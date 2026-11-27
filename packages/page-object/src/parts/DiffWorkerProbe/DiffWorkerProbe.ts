// Inspects the renderer's dedicated workers over the DevTools protocol to tell
// whether the WebAssembly diff backend (`@vscode/diff` with `useWasm: true`) was
// really instantiated. VS Code silently falls back to the built-in TypeScript
// algorithm when the WebAssembly module fails to load, so the diff editor UI alone
// cannot prove which backend computed a diff.

export interface WasmInstanceInfo {
  readonly exports: readonly string[]
  readonly memoryBytes: number
}

export interface DiffWorkerState {
  readonly error?: string
  readonly instances: readonly WasmInstanceInfo[]
  readonly title: string
  readonly url: string
}

// Exports of the `@vscode/diff` WebAssembly module that its loader binds after instantiation.
const diffModuleExports = ['computeDiff', 'inputBuffer']

const objectGroup = 'vscode-memory-leak-finder-diff-worker-probe'

const describeInstancesFunction = `function () {
  return this.map((instance) => {
    const exports = Object.keys(instance.exports)
    const memory = instance.exports.memory
    return { exports, memoryBytes: memory instanceof WebAssembly.Memory ? memory.buffer.byteLength : 0 }
  })
}`

const unwrap = (response: any, method: string): any => {
  if (response?.error) {
    throw new Error(`${method} failed: ${response.error.message}`)
  }
  const result = response?.result
  if (result?.exceptionDetails) {
    throw new Error(`${method} threw: ${result.exceptionDetails.exception?.description || result.exceptionDetails.text}`)
  }
  return result
}

const getWasmInstances = async (browserRpc: any, sessionId: string): Promise<WasmInstanceInfo[]> => {
  const invoke = async (method: string, params: Record<string, unknown>) => {
    return unwrap(await browserRpc.invokeWithSession(sessionId, method, params), method)
  }
  try {
    const prototype = await invoke('Runtime.evaluate', {
      expression: 'WebAssembly.Instance.prototype',
      objectGroup,
    })
    const instances = await invoke('Runtime.queryObjects', {
      objectGroup,
      prototypeObjectId: prototype.result.objectId,
    })
    const described = await invoke('Runtime.callFunctionOn', {
      functionDeclaration: describeInstancesFunction,
      objectId: instances.objects.objectId,
      returnByValue: true,
    })
    return described.result.value
  } finally {
    await browserRpc.invokeWithSession(sessionId, 'Runtime.releaseObjectGroup', { objectGroup })
  }
}

export const getDiffWorkerStates = async (browserRpc: any): Promise<DiffWorkerState[]> => {
  if (!browserRpc) {
    throw new Error('browser rpc is required to inspect diff workers')
  }
  const { targetInfos } = unwrap(await browserRpc.invoke('Target.getTargets', {}), 'Target.getTargets')
  const workers = targetInfos.filter((targetInfo: any) => targetInfo.type === 'worker')
  const states: DiffWorkerState[] = []
  for (const worker of workers) {
    let sessionId: string | undefined
    try {
      const attached = unwrap(
        await browserRpc.invoke('Target.attachToTarget', { flatten: true, targetId: worker.targetId }),
        'Target.attachToTarget',
      )
      sessionId = attached.sessionId as string
      const instances = await getWasmInstances(browserRpc, sessionId)
      states.push({ instances, title: worker.title, url: worker.url })
    } catch (error) {
      // The worker may have terminated between listing and attaching; keep the reason for diagnostics.
      states.push({ error: String((error as Error)?.message || error), instances: [], title: worker.title, url: worker.url })
    } finally {
      if (sessionId) {
        await browserRpc.invoke('Target.detachFromTarget', { sessionId })
      }
    }
  }
  return states
}

export const isWasmDiffInstance = (instance: WasmInstanceInfo): boolean => {
  return diffModuleExports.every((name) => instance.exports.includes(name))
}

export const isWasmDiffLoaded = (states: readonly DiffWorkerState[]): boolean => {
  return states.some((state) => state.instances.some(isWasmDiffInstance))
}
