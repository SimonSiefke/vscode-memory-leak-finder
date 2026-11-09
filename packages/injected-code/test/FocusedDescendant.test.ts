/** @jest-environment jsdom */
import { expect, test } from '@jest/globals'
import * as Conditions from '../src/parts/FocusedCondition/FocusedCondition.ts'

const document = (globalThis as any).document
const focusedInputOptions = { descendantSelector: ':is(.native-edit-context, .inputarea)' }

test('focus assertions require a supported input inside the requested editor', () => {
  document.body.innerHTML =
    '<div class="editor-instance"><textarea class="inputarea"></textarea><button>Other</button></div><textarea></textarea>'
  const editor = document.querySelector('.editor-instance')
  for (const selector of ['button', 'body > textarea']) {
    document.querySelector(selector).focus()
    expect(Conditions.toBeFocused(editor, focusedInputOptions)).toBe(false)
  }
  const input = editor.querySelector('textarea')
  input.focus()
  expect(Conditions.toBeFocused(input)).toBe(true)
  expect(Conditions.toBeFocused(editor)).toBe(false)
  expect(Conditions.toBeFocused(editor, focusedInputOptions)).toBe(true)
})
