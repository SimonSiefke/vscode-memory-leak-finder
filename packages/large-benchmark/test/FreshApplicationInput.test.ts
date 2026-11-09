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

test.each([
  ['', 20],
  ['file.txt', 20],
  ['', 250],
  ['file.txt', 250],
])(
  'fresh-workspace Quick Open can finish its debounced search despite unrelated DOM mutations (initial query: %s, delay: %s)',
  async (initial, debounce) => {
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
      }, debounce)
    })
    const noise = setInterval(() => {
      document.getElementById('noise')!.textContent = String(performance.now())
    }, 10)
    try {
      const result = typeAndWaitFor({
        locator: { selector: '#query' },
        text: 'file.txt',
        waitFor: { selector: '#result' },
        timeout: debounce + 100,
      })
      await jest.advanceTimersByTimeAsync(debounce + 60)
      await expect(result).resolves.toBeUndefined()
      expect(document.getElementById('result')!.textContent).toBe('file.txt')
    } finally {
      clearInterval(noise)
      clearTimeout(pending!)
    }
  },
)

test.each([false, true])('Quick Open refreshes a query after its initial search returns no results (DOM noise: %s)', async (noisy) => {
  jest.useFakeTimers()
  document.body.innerHTML = '<input id="query"><div id="noise"></div>'
  const input = document.querySelector('input')!
  const queries: number[] = []
  input.addEventListener('input', () => {
    if (input.value !== 'file.txt') return
    queries.push(performance.now())
    // Workspace indexing/provider initialization finishes after the initial input.
    if (performance.now() < 250) return
    const result = document.createElement('div')
    result.id = 'result'
    document.body.append(result)
  })
  const noise = noisy ? setInterval(() => (document.getElementById('noise')!.textContent = String(performance.now())), 10) : undefined
  try {
    const result = typeAndWaitFor({ locator: { selector: '#query' }, text: 'file.txt', waitFor: { selector: '#result' }, timeout: 1500 })
    const assertion = expect(result).resolves.toBeUndefined()
    await jest.advanceTimersByTimeAsync(1600)
    await assertion
    expect(queries).toHaveLength(2)
    expect(queries[1]! - queries[0]!).toBeGreaterThanOrEqual(500)
  } finally {
    if (noise !== undefined) clearInterval(noise)
  }
})
