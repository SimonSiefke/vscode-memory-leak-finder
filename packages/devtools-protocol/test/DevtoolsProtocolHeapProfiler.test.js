import { expect, test } from '@jest/globals'
import * as DevtoolsProtocolHeapProfiler from '../src/parts/DevtoolsProtocolHeapProfiler/DevtoolsProtocolHeapProfiler.js'

const createSession = (response = {}) => {
  const calls = []
  const session = {
    async invoke(method, params) {
      calls.push([method, params])
      return response
    },
  }
  return {
    calls,
    session,
  }
}

test('startSampling invokes HeapProfiler.startSampling with the exact parameters', async () => {
  const { calls, session } = createSession()
  const options = {
    includeObjectsCollectedByMajorGC: true,
    includeObjectsCollectedByMinorGC: true,
    samplingInterval: 32 * 1024,
  }

  await DevtoolsProtocolHeapProfiler.startSampling(session, options)

  expect(calls).toEqual([['HeapProfiler.startSampling', options]])
})

test('getSamplingProfile invokes HeapProfiler.getSamplingProfile and returns the profile', async () => {
  const profile = { head: { callFrame: {}, children: [], id: 1, selfSize: 0 }, samples: [] }
  const { calls, session } = createSession({ result: { profile } })

  const result = await DevtoolsProtocolHeapProfiler.getSamplingProfile(session)

  expect(calls).toEqual([['HeapProfiler.getSamplingProfile', {}]])
  expect(result).toEqual({ profile })
})

test('stopSampling invokes HeapProfiler.stopSampling', async () => {
  const { calls, session } = createSession({ result: { profile: {} } })

  await DevtoolsProtocolHeapProfiler.stopSampling(session)

  expect(calls).toEqual([['HeapProfiler.stopSampling', {}]])
})

test('stopSampling rejects with an internal error code when sampling was not started', async () => {
  const { session } = createSession({ error: { code: -32000, message: 'V8 sampling heap profiler was not started' } })

  await expect(DevtoolsProtocolHeapProfiler.stopSampling(session)).rejects.toMatchObject({
    code: 'E_DEVTOOLS_INTERNAL_ERROR',
    message: 'V8 sampling heap profiler was not started',
  })
})
