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
  DevtoolsProtocolTracing,
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
  DevtoolsProtocolTracing,
}
