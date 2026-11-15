export interface CountHistoryMeasure {
  readonly title: string
  readonly unit: 'count' | 'bytes' | 'elements' | 'entries'
  readonly description: string
  readonly path?: readonly string[]
}

// Only collectors with a documented numeric absolute total belong here. Row-based
// leak diagnostics must not be reduced to an invented total.
export const countHistoryMeasures = {
  'function-count': { title: 'Function Count', unit: 'count', description: 'Objects inheriting from Function.prototype.' },
  'object-count': { title: 'Object Count', unit: 'count', description: 'Objects returned by the existing object-count collector.' },
  'string-object-count': {
    title: 'String Object Count',
    unit: 'count',
    description: 'Live flat, concatenated, and sliced string heap nodes, counting each object once.',
  },
  'string-count': {
    title: 'Snapshot String Table Count',
    unit: 'count',
    description: 'Snapshot string-table entries, including metadata; distinct from live string object count.',
  },
  'array-count': { title: 'Array Count', unit: 'count', description: 'Objects inheriting from Array.prototype.' },
  'weak-map-count': { title: 'WeakMap Count', unit: 'count', description: 'WeakMap objects, not the number of entries inside them.' },
  'weak-set-count': { title: 'WeakSet Count', unit: 'count', description: 'WeakSet objects, not the number of entries inside them.' },
  'map-count': { title: 'Map Count', unit: 'count', description: 'Map objects.' },
  'promise-count': { title: 'Promise Count', unit: 'count', description: 'Promise objects.' },
  'error-count': { title: 'Error Count', unit: 'count', description: 'Error objects.' },
  'regex-count': { title: 'RegExp Count', unit: 'count', description: 'RegExp objects.' },
  'closure-count': { title: 'Closure Count', unit: 'count', description: 'Closures identified by the existing closure-count collector.' },
  'object-shape-count': {
    title: 'Object Shape Count',
    unit: 'count',
    description: 'Object shapes identified by the heap-snapshot collector.',
  },
  'native-context-count': { title: 'Native Context Count', unit: 'count', description: 'V8 native context heap nodes.' },
  'typed-array-count': {
    title: 'Typed Array Count',
    unit: 'count',
    description: 'Typed array occurrences in object values reported by the collector; repeated references can count more than once.',
  },
  'weak-ref-count': {
    title: 'WeakRef Count',
    unit: 'count',
    description: 'WeakRef objects; unavailable on releases without WeakRef support.',
  },
  'finalization-registry-count': {
    title: 'FinalizationRegistry Count',
    unit: 'count',
    description: 'FinalizationRegistry objects; unavailable on releases without support.',
  },
  'event-listener-count': {
    title: 'Event Listener Count',
    unit: 'count',
    description: 'DOM event listeners on EventTarget objects, document, and window; excludes internal VS Code event-emitter subscriptions.',
  },
  'event-target-count': { title: 'EventTarget Count', unit: 'count', description: 'EventTarget objects.' },
  'attached-dom-node-count': { title: 'Attached DOM Node Count', unit: 'count', description: 'DOM nodes attached to the document.' },
  'detached-dom-node-count': { title: 'Detached DOM Node Count', unit: 'count', description: 'DOM nodes detached from the document.' },
  'mutation-observer-count': { title: 'MutationObserver Count', unit: 'count', description: 'MutationObserver objects.' },
  'resize-observer-count': { title: 'ResizeObserver Count', unit: 'count', description: 'ResizeObserver objects.' },
  'intersection-observer-count': { title: 'IntersectionObserver Count', unit: 'count', description: 'IntersectionObserver objects.' },
  'abort-controller-count': { title: 'AbortController Count', unit: 'count', description: 'AbortController objects.' },
  'abort-signal-count': { title: 'AbortSignal Count', unit: 'count', description: 'AbortSignal objects.' },
  'canvas-count': { title: 'Canvas Count', unit: 'count', description: 'Canvas elements.' },
  'string-object-bytes': {
    title: 'String Object Bytes',
    unit: 'bytes',
    description: 'Sum of string heap-node self_size, including node overhead; not character count or retained size.',
  },
  'array-element-count': {
    title: 'Array Element Count',
    unit: 'elements',
    description: 'Sum of array lengths, including sparse slots; not allocated bytes.',
  },
  'map-size': { title: 'Map Size', unit: 'entries', description: 'Sum of the number of entries in all Map objects.' },
  'set-size': { title: 'Set Size', unit: 'entries', description: 'Sum of the number of entries in all Set objects.' },
  'array-buffer-bytes': {
    title: 'ArrayBuffer Bytes',
    unit: 'bytes',
    description: 'ArrayBuffer backing-store bytes exposed by the snapshot collector.',
    path: ['after', 'bytes'],
  },
} as const satisfies Record<string, CountHistoryMeasure>

export type HistoryMeasure = keyof typeof countHistoryMeasures

export const historyMeasure = (value: string): HistoryMeasure => {
  if (!Object.hasOwn(countHistoryMeasures, value))
    throw new Error(`History measure must be one of: ${Object.keys(countHistoryMeasures).join(', ')}`)
  return value as HistoryMeasure
}

export const historyMeasures = (value: string): HistoryMeasure[] => {
  if (value.trim() === 'all') return Object.keys(countHistoryMeasures) as HistoryMeasure[]
  return [...new Set(value.split(',').map((item) => historyMeasure(item.trim())))]
}

export const historyMeasureDefinition = (measure: HistoryMeasure): CountHistoryMeasure => countHistoryMeasures[measure]

export const historyValue = (measure: HistoryMeasure, data: unknown): number => {
  const definition = historyMeasureDefinition(measure)
  const key = measure.replace(/-([a-z0-9])/g, (_match, letter: string) => letter.toUpperCase())
  let value: unknown = data
  for (const part of [key, ...(definition.path ?? ['after'])])
    value = value !== null && typeof value === 'object' ? (value as Record<string, unknown>)[part] : undefined
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
    throw new Error(`Invalid absolute ${measure} total (${definition.unit})`)
  return value
}
