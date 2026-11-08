import { expect, test } from '@jest/globals'
import { typeCharacters } from '../src/parts/PageKeyBoard/PageKeyBoard.ts'

test('character typing emits distinct keydown and keyup events for every character', async () => {
  const events: any[] = []
  const rpc = {
    invoke: async (method: string, params: any) => {
      events.push({ method, ...params })
      return { result: {} }
    },
  }
  await typeCharacters(rpc, 'a'.repeat(100))
  expect(events).toHaveLength(200)
  expect(events.every((event) => event.method === 'Input.dispatchKeyEvent')).toBe(true)
  expect(events.filter((event) => event.type === 'keyDown')).toHaveLength(100)
  expect(events[0]).toMatchObject({ key: 'a', text: 'a', type: 'keyDown' })
  expect(events[1]).toMatchObject({ key: 'a', type: 'keyUp' })
})
