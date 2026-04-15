import { test, expect } from '@jest/globals'
/**
 * @jest-environment jsdom
 */
import * as TestFrameWork from '../src/parts/TestFrameWork/TestFrameWork.ts'

test('pressKeyExponential returns when element becomes visible between retries', async () => {
  document.body.innerHTML = ''
  const focusTarget = document.createElement('button')
  document.body.append(focusTarget)
  focusTarget.focus()

  let pressCount = 0
  focusTarget.addEventListener('keydown', () => {
    pressCount++
    const existingQuickPick = document.querySelector('.quick-input-widget')
    if (existingQuickPick) {
      existingQuickPick.remove()
      return
    }
    setTimeout(() => {
      const quickPick = document.createElement('div')
      quickPick.className = 'quick-input-widget'
      document.body.append(quickPick)
    }, 0)
  })

  await TestFrameWork.pressKeyExponential({
    key: 'Meta+Shift+P',
    timeout: 100,
    waitFor: {
      selector: '.quick-input-widget',
    },
  })

  expect(document.querySelector('.quick-input-widget')).not.toBeNull()
  expect(pressCount).toBe(1)
})