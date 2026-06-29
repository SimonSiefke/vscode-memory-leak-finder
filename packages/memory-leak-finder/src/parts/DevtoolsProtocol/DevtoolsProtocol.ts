const url = new URL('../../../../devtools-protocol/src/index.js', import.meta.url).toString()
const module = await import(url)

const {
  DevtoolsProtocolDomDebugger,
  DevtoolsProtocolHeapProfiler,
  DevtoolsProtocolMemory,
  DevtoolsProtocolPage,
  DevtoolsProtocolPerformance,
  DevtoolsProtocolProfiler,
  DevtoolsProtocolRuntime,
  DevtoolsProtocolTarget,
} = module

export {
  DevtoolsProtocolHeapProfiler,
  DevtoolsProtocolPage,
  DevtoolsProtocolPerformance,
  DevtoolsProtocolProfiler,
  DevtoolsProtocolRuntime,
  DevtoolsProtocolTarget,
  DevtoolsProtocolMemory,
  DevtoolsProtocolDomDebugger,
}
