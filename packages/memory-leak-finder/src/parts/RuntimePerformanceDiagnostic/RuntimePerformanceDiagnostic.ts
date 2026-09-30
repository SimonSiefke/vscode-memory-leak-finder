import type { Dynamic, Session } from '../Types/Types.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const create = (session: Session) => [session]
export const start = async (session: Session, key: string, install: Function) => {
  const result = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `(async () => {
      const key = ${JSON.stringify(key)};
      if (globalThis[key]) throw new Error('Performance diagnostic is already active');
      const tracker = await (${install.toString()})();
      Object.defineProperty(globalThis, key, { value: tracker, configurable: true });
      return { available: tracker.available !== false, reason: tracker.reason };
    })()`,
    awaitPromise: true,
    returnByValue: true,
  })
  return result
}
export const stop = async (session: Session, key: string) =>
  DevtoolsProtocolRuntime.evaluate(session, {
    expression: `(() => {
    const tracker = globalThis[${JSON.stringify(key)}];
    if (!tracker) return { available: false, reason: 'Measurement execution context was lost', metrics: {}, rows: [] };
    try { return tracker.snapshot(); } finally { tracker.dispose(); delete globalThis[${JSON.stringify(key)}]; }
  })()`,
    returnByValue: true,
  })
export const release = async (session: Session, key: string) =>
  DevtoolsProtocolRuntime.evaluate(session, {
    expression: `(() => { const key = ${JSON.stringify(key)}; try { globalThis[key]?.dispose(); } finally { delete globalThis[key]; } })()`,
    returnByValue: true,
  })
export const compare = (_before: Dynamic, after: Dynamic) => ({ ...after, isLeak: false })
export const isLeak = () => false
export const summary = (result: Dynamic): string => {
  if (result.available === false) return `Unavailable: ${result.reason}`
  const lines = Object.entries(result.metrics || {}).map(([name, value]) => `${name} | ${value}`)
  if (result.incomplete) lines.unshift('Incomplete capture: see result metadata')
  for (const row of (result.rows || []).slice(0, 20)) lines.push(`${row.name} | count ${row.count ?? '-'} | ms ${row.durationMs ?? '-'}`)
  return lines.join('\n')
}
