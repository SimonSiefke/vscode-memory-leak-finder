import type {
  RetainerRiverEvidence,
  RetainerRiverLink,
  RetainerRiverNode,
  RetainerRiverReport,
  RetainerRiverSourceLocation,
} from './report.ts'
import { RetainerRiverSchemaVersion } from './report.ts'

const mb = (value: number): number => Math.round(value * 1024 * 1024)

const original = (source: string, line: number, column: number, name?: string): RetainerRiverSourceLocation => ({
  column,
  line,
  name,
  source,
})

const evidence = (
  retainingProperty: string,
  leakedObject: string,
  source: string,
  line: number,
  service: string,
  retainer: string,
): RetainerRiverEvidence => ({
  allocationStack: [
    {
      functionName: `new ${service}`,
      generated: original('workbench.desktop.main.js', 2317, 104),
      original: original(source, line, 12, service),
    },
    {
      functionName: 'InstantiationService._createInstance',
      generated: original('workbench.desktop.main.js', 611, 845),
      original: original('src/vs/platform/instantiation/common/instantiationService.ts', 183, 18, '_createInstance'),
    },
  ],
  leakedObject,
  leakedObjectStack: [
    {
      functionName: `new ${leakedObject}`,
      generated: original('workbench.desktop.main.js', 1968, 7714),
      original: original(source, line + 37, 9, leakedObject),
    },
    {
      functionName: `${service}.create`,
      generated: original('workbench.desktop.main.js', 1968, 7421),
      original: original(source, line + 22, 17, 'create'),
    },
  ],
  path: [
    {
      edgeType: 'property',
      property: '_serviceBrand',
      sourceName: '(GC roots)',
      sourceType: 'synthetic',
      targetName: service,
    },
    {
      edgeType: 'property',
      property: retainingProperty,
      sourceName: service,
      sourceType: 'object',
      targetName: retainer,
    },
    {
      edgeType: 'element',
      property: '[0]',
      sourceName: retainer,
      sourceType: 'array',
      targetName: leakedObject,
    },
  ],
  retainingLocation: original(source, line, 12, service),
  retainingProperty,
})

interface Flow {
  readonly bytes: number
  readonly count: number
  readonly id: string
  readonly inferred?: boolean
  readonly leak: string
  readonly property: string
  readonly retainer: string
  readonly retainerKind: string
  readonly root: string
  readonly service: string
  readonly source: string
}

const flows: readonly Flow[] = [
  {
    bytes: mb(18.4),
    count: 24,
    id: 'editor-widgets',
    leak: 'CodeEditorWidget',
    property: '_listeners',
    retainer: 'Emitter.listenerList',
    retainerKind: 'closure collection',
    root: 'Global handles',
    service: 'EditorService',
    source: 'src/vs/workbench/services/editor/common/editorService.ts',
  },
  {
    bytes: mb(12.2),
    count: 41,
    id: 'text-models',
    leak: 'TextModel',
    property: '_models',
    retainer: 'ResourceMap<URI, ModelData>',
    retainerKind: 'map',
    root: 'Global handles',
    service: 'TextFileService',
    source: 'src/vs/workbench/services/textfile/common/textFileService.ts',
  },
  {
    bytes: mb(8.7),
    count: 9,
    id: 'extension-host',
    leak: 'ExtensionHostManager',
    property: '_extensionHostManagers',
    retainer: 'Array(9) callbacks',
    retainerKind: 'array',
    root: 'Native context',
    service: 'ExtensionService',
    source: 'src/vs/workbench/services/extensions/common/extensionService.ts',
  },
  {
    bytes: mb(6.1),
    count: 57,
    id: 'search-results',
    leak: 'FileMatch',
    property: '_resultSets',
    retainer: 'Map<string, SearchResult>',
    retainerKind: 'map',
    root: 'Window / global',
    service: 'SearchService',
    source: 'src/vs/workbench/services/search/common/searchService.ts',
  },
  {
    bytes: mb(3.6),
    count: 72,
    id: 'hover-listeners',
    inferred: true,
    leak: 'HTMLElement .monaco-hover',
    property: 'mouseover',
    retainer: 'closure showHover',
    retainerKind: 'closure',
    root: 'Window / global',
    service: 'hoverService.ts (inferred owner)',
    source: 'src/vs/platform/hover/browser/hoverService.ts',
  },
  {
    bytes: mb(2.1),
    count: 7,
    id: 'terminals',
    leak: 'TerminalInstance',
    property: '_instances',
    retainer: 'Set<TerminalInstance>',
    retainerKind: 'set',
    root: 'Global handles',
    service: 'TerminalService',
    source: 'src/vs/workbench/contrib/terminal/browser/terminalService.ts',
  },
]

const nodes: RetainerRiverNode[] = []
const links: RetainerRiverLink[] = []

for (const [index, flow] of flows.entries()) {
  const retainedEvidence = evidence(flow.property, flow.leak, flow.source, 120 + index * 47, flow.service, flow.retainer)
  const stageNodes: readonly RetainerRiverNode[] = [
    {
      id: `${flow.id}:root`,
      kind: 'gc root',
      label: flow.root,
      objectCount: flow.count,
      retainedBytes: flow.bytes,
      stage: 'root',
    },
    {
      id: `${flow.id}:service`,
      inferred: flow.inferred,
      kind: flow.inferred ? 'source owner' : 'service',
      label: flow.service,
      objectCount: flow.count,
      retainedBytes: flow.bytes,
      stage: 'service',
    },
    {
      id: `${flow.id}:retainer`,
      kind: flow.retainerKind,
      label: flow.retainer,
      objectCount: flow.count,
      retainedBytes: flow.bytes,
      stage: 'retainer',
    },
    {
      id: `${flow.id}:leak`,
      kind: 'leaked object',
      label: flow.leak,
      objectCount: flow.count,
      retainedBytes: flow.bytes,
      stage: 'leak',
    },
  ]
  nodes.push(...stageNodes)
  for (let stage = 0; stage < stageNodes.length - 1; stage++) {
    links.push({
      evidence: [retainedEvidence],
      flowId: flow.id,
      id: `${flow.id}:${stage}`,
      objectCount: flow.count,
      retainedBytes: flow.bytes,
      source: stageNodes[stage].id,
      target: stageNodes[stage + 1].id,
    })
  }
}

const retainedBytes = flows.reduce((total, flow) => total + flow.bytes, 0)

export const fixtureReport: RetainerRiverReport = {
  generatedAt: '2026-07-17T20:12:00.000Z',
  isLeak: true,
  links,
  metadata: {
    processType: 'renderer',
    runs: 12,
    testName: 'activity-bar-switch-views',
  },
  nodes,
  schemaVersion: RetainerRiverSchemaVersion,
  summary: {
    leakedObjects: flows.reduce((total, flow) => total + flow.count, 0),
    retainedBytes,
    retainingPaths: flows.length,
  },
}
