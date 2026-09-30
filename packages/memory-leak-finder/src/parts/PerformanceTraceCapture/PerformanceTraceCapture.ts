import type { Dynamic, Session } from '../Types/Types.ts'
import { DevtoolsProtocolRuntime, DevtoolsProtocolTracing } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const create = (session: Session): [Session, Dynamic] => [
  session,
  { events: [], active: false, incomplete: false, dispose: () => {} },
]
export const start = async (session: Session, state: Dynamic) => {
  if (!session.on || !session.off) throw new Error('Tracing requires event listeners')
  if (state.active) throw new Error('Performance trace is already active')
  state.ending = false
  state.events = []
  state.incomplete = false
  state.marker = `performance-measure-${Date.now()}-${Math.random()}`
  let resolveComplete: () => void = () => {}
  state.complete = new Promise<void>((resolve) => {
    resolveComplete = resolve
  })
  const data = (message: Dynamic) => {
    const events = message?.params?.value
    if (!Array.isArray(events)) return
    const room = 250000 - state.events.length
    if (events.length > room) state.incomplete = true
    for (let index = 0; index < Math.min(room, events.length); index++) state.events.push(events[index])
  }
  const complete = (message: Dynamic) => {
    state.incomplete ||= message?.params?.dataLossOccurred === true
    state.active = false
    resolveComplete()
  }
  state.dispose = () => {
    session.off?.('Tracing.dataCollected', data)
    session.off?.('Tracing.tracingComplete', complete)
  }
  session.on('Tracing.dataCollected', data)
  session.on('Tracing.tracingComplete', complete)
  try {
    await DevtoolsProtocolTracing.start(session, {
      transferMode: 'ReportEvents',
      traceConfig: {
        recordMode: 'recordUntilFull',
        includedCategories: [
          '-*',
          'devtools.timeline',
          'disabled-by-default-devtools.timeline',
          'disabled-by-default-devtools.timeline.stack',
          'v8',
          'v8.execute',
          'disabled-by-default-v8.compile',
          'blink.console',
        ],
      },
    })
    state.active = true
    await DevtoolsProtocolRuntime.evaluate(session, {
      expression: `console.timeStamp(${JSON.stringify(state.marker + ':start')})`,
      returnByValue: true,
    })
  } catch (error) {
    try {
      await releaseResources(session, state)
    } finally {
      throw error
    }
  }
  return { available: true, events: [] }
}
export const stop = async (session: Session, state: Dynamic) => {
  try {
    await DevtoolsProtocolRuntime.evaluate(session, {
      expression: `console.timeStamp(${JSON.stringify(state.marker + ':end')})`,
      returnByValue: true,
    })
    await endTrace(session, state)
    return { events: state.events, marker: state.marker, incomplete: state.incomplete }
  } finally {
    await releaseResources(session, state)
  }
}
const endTrace = async (session: Session, state: Dynamic) => {
  if (!state.active || state.ending) return
  state.ending = true
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      (async () => {
        await DevtoolsProtocolTracing.end(session, {})
        await state.complete
      })(),
      new Promise<void>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Timed out waiting for trace completion')), 10000)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}
export const releaseResources = async (session: Session, state: Dynamic) => {
  try {
    await endTrace(session, state)
  } finally {
    state.active = false
    state.dispose()
  }
}
