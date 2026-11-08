import { expect, test } from '@jest/globals'
import { create } from '../src/parts/InboxCanvasObserver/InboxCanvasObserver.ts'

test('removes capture listeners through the multicast RPC API after failed initialization', async () => {
  const listeners: Record<string, Set<(message: any) => void>> = {}
  const rpc = {
    listeners,
    on(event: string, listener: (message: any) => void) {
      ;(listeners[event] ||= new Set()).add(listener)
    },
    off(event: string, listener: (message: any) => void) {
      listeners[event]?.delete(listener)
      if (!listeners[event]?.size) delete listeners[event]
    },
    async invoke(method: string) {
      if (method === 'Debugger.enable') {
        for (const listener of listeners['Debugger.scriptParsed'] || []) {
          listener({ params: { scriptId: 'sessions', url: '/vs/sessions/sessions.desktop.main.js' } })
        }
      }
      return { result: method === 'Debugger.getScriptSource' ? { scriptSource: 'no matching factory' } : {} }
    },
  }
  const observer = create({ rpc })
  for (let attempt = 0; attempt < 2; attempt++) {
    await expect(observer.arm()).rejects.toThrow('Expected one real canvas factory')
    expect(Object.keys(listeners)).toEqual([])
  }
})
