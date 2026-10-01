import { expect, jest, test } from '@jest/globals'

const resume = jest.fn<(...args: any[]) => Promise<void>>().mockResolvedValue(undefined)
jest.unstable_mockModule('../src/parts/DevtoolsProtocol/DevtoolsProtocol.ts', () => ({
  DevtoolsProtocolRuntime: { runIfWaitingForDebugger: resume },
  DevtoolsProtocolTarget: { setAutoAttach: async () => {} },
}))
jest.unstable_mockModule('../src/parts/WaitForAttachedEvent/WaitForAttachedEvent.ts', () => ({
  waitForAttachedEvent: async () => ({ params: { sessionId: 'primary', targetInfo: { targetId: 'primary-target' } } }),
}))
const { waitForSession } = await import('../src/parts/WaitForSession/WaitForSession.ts')

test('new auxiliary targets are resumed without replacing the measured primary session', async () => {
  let attached: (message: any) => void = () => {}
  const browserRpc = {
    on: (_event: string, listener: typeof attached) => {
      attached = listener
    },
  }
  const primary = await waitForSession(browserRpc, 1000)
  attached({ params: { sessionId: 'auxiliary', targetInfo: { targetId: 'auxiliary-target' } } })
  expect(resume).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'auxiliary' }))
  expect(primary.sessionId).toBe('primary')
  expect(primary.targetId).toBe('primary-target')
})

test('a target detaching before resume does not reject initialization', async () => {
  resume.mockRejectedValueOnce(new Error('Target closed'))
  let attached: (message: any) => void = () => {}
  const browserRpc = {
    on: (_event: string, listener: typeof attached) => {
      attached = listener
    },
  }
  await waitForSession(browserRpc, 1000)
  attached({ params: { sessionId: 'closing' } })
  await Promise.resolve()
})
