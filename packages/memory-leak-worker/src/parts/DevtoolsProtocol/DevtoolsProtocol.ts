const url = new URL('../../../../devtools-protocol/src/index.ts', import.meta.url).toString()
const module = await import(url)

const {
  DevtoolsProtocolHeapProfiler,
  DevtoolsProtocolPage,
  DevtoolsProtocolRuntime,
  DevtoolsProtocolTarget,
  DevtoolsProtocolMemory,
  DevtoolsProtocolDomDebugger,
} = module

export {
  DevtoolsProtocolHeapProfiler,
  DevtoolsProtocolPage,
  DevtoolsProtocolRuntime,
  DevtoolsProtocolTarget,
  DevtoolsProtocolMemory,
  DevtoolsProtocolDomDebugger,
}
