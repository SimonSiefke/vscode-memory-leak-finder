/** @jest-environment jsdom */
/// <reference lib="dom" />
import { afterEach, expect, jest, test } from '@jest/globals'

// jsdom has no layout; keep the real DOM querying and input event machinery.
const conditionUrl = new URL('../../injected-code/src/parts/SingleElementConditionMap/SingleElementConditionMap.ts', import.meta.url).href
jest.unstable_mockModule(conditionUrl, () => ({ getFunction: () => (element: Element) => element.isConnected }))
const frameworkUrl = new URL('../../injected-code/src/parts/TestFrameWork/TestFrameWork.ts', import.meta.url).href
const { typeAndWaitFor } = await import(frameworkUrl)
afterEach(() => {
  jest.useRealTimers()
  document.body.replaceChildren()
})

test.each(['', 'file.txt'])(
  'fresh-workspace Quick Open can finish its debounced search despite unrelated DOM mutations (initial query: %s)',
  async (initial) => {
    jest.useFakeTimers()
    document.body.innerHTML = '<input id="query"><div id="noise"></div>'
    const input = document.querySelector('input')!
    input.value = initial
    let pending: ReturnType<typeof setTimeout>
    input.addEventListener('input', () => {
      clearTimeout(pending)
      pending = setTimeout(() => {
        const result = document.createElement('div')
        result.id = 'result'
        result.textContent = input.value
        document.body.append(result)
      }, 20)
    })
    const noise = setInterval(() => {
      document.getElementById('noise')!.textContent = String(performance.now())
    }, 1)
    try {
      const result = typeAndWaitFor({ locator: { selector: '#query' }, text: 'file.txt', waitFor: { selector: '#result' }, timeout: 100 })
      await jest.advanceTimersByTimeAsync(60)
      await expect(result).resolves.toBeUndefined()
      expect(document.getElementById('result')!.textContent).toBe('file.txt')
    } finally {
      clearInterval(noise)
      clearTimeout(pending!)
    }
  },
)
