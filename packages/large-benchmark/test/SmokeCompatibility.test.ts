import { expect, test } from '@jest/globals'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'
import { deepStrictEqual } from 'node:assert'
import { smokeCompatibility } from '../src/parts/SmokeCompatibility/SmokeCompatibility.ts'

const defaults = [
  {
    header: 'Thinking Effort',
    options: [
      { label: 'Low', checked: false },
      { label: 'Medium', checked: true },
      { label: 'High', checked: false },
    ],
  },
  { header: 'Context Size', options: [{ label: '272K', checked: true }] },
]
const observed = () => [{ ...defaults[0]!, header: 'Effort Level' }, defaults[1]!]
const adapt = async (sections: typeof defaults, expected = defaults) => {
  class Chat {
    async getModelConfigSections() {
      return sections
    }
  }
  const messages: string[] = []
  runInNewContext(smokeCompatibility, {
    root: '/harness/test/smoke',
    join,
    load: (name: string) => (name.includes('automation') ? { Chat } : { MOCK_CONFIG_MODEL_DEFAULT_SECTIONS: expected }),
    console: { log: (message: string) => messages.push(message) },
  })
  return { sections: JSON.parse(JSON.stringify(await new Chat().getModelConfigSections())), messages }
}

test('reproduces the captured PR failure and accepts only the historical effort header alias', async () => {
  expect(() => deepStrictEqual(observed(), defaults)).toThrow()
  const adapted = await adapt(observed())
  deepStrictEqual(adapted.sections, defaults)
  expect(adapted.messages).toEqual(['[smoke-compatibility] model effort header: "Effort Level" -> "Thinking Effort"'])
  expect(observed()[0]!.header).toBe('Effort Level')
})

test('continues rejecting wrong options, defaults, missing sections, and unknown headers', async () => {
  for (const sections of [
    [{ ...observed()[0]!, options: [{ label: 'Low', checked: true }] }, defaults[1]!],
    [{ ...observed()[0]!, header: 'Unknown' }, defaults[1]!],
    [observed()[0]!],
    [defaults[1]!, observed()[0]!],
  ]) {
    const adapted = await adapt(sections)
    expect(() => deepStrictEqual(adapted.sections, defaults)).toThrow()
  }
  const wrong = observed()
  wrong[0] = { ...wrong[0]!, options: [{ label: 'Low', checked: true }] }
  const adapted = await adapt(wrong)
  expect(() => deepStrictEqual(adapted.sections, defaults)).toThrow()
})

test('leaves matching and unrelated headers untouched and supports the reverse alias', async () => {
  const matching = await adapt(defaults)
  expect(matching.messages).toEqual([])
  deepStrictEqual(matching.sections, defaults)
  const reverse = await adapt(defaults, observed())
  deepStrictEqual(reverse.sections, observed())
})
