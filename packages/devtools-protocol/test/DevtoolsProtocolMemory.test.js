import { expect, test } from '@jest/globals'
import * as DevtoolsProtocolMemory from '../src/parts/DevtoolsProtocolMemory/DevtoolsProtocolMemory.js'

const createSession = () => {
  const calls = []
  const session = {
    async invoke(method, params) {
      calls.push([method, params])
      return {}
    },
  }
  return {
    calls,
    session,
  }
}

test('startSampling invokes Memory.startSampling with the exact parameters', async () => {
  const { calls, session } = createSession()
  const options = {
    samplingInterval: 32 * 1024,
    suppressRandomness: false,
  }

  await DevtoolsProtocolMemory.startSampling(session, options)

  expect(calls).toEqual([['Memory.startSampling', options]])
})

test('getSamplingProfile invokes Memory.getSamplingProfile with the exact parameters', async () => {
  const { calls, session } = createSession()

  await DevtoolsProtocolMemory.getSamplingProfile(session, {})

  expect(calls).toEqual([['Memory.getSamplingProfile', {}]])
})

test('stopSampling invokes Memory.stopSampling with the exact parameters', async () => {
  const { calls, session } = createSession()

  await DevtoolsProtocolMemory.stopSampling(session, {})

  expect(calls).toEqual([['Memory.stopSampling', {}]])
})
