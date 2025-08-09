import { expect, test } from '@jest/globals'
import * as DevtoolsEventType from '../src/parts/DevtoolsEventType/DevtoolsEventType.ts'

test('DevtoolsEventType exports debugger constants', () => {
  expect(DevtoolsEventType.DebuggerPaused).toBe('Debugger.paused')
  expect(DevtoolsEventType.DebuggerResumed).toBe('Debugger.resumed')
  expect(DevtoolsEventType.DebuggerScriptParsed).toBe('Debugger.scriptParsed')
})

test('DevtoolsEventType exports page constants', () => {
  expect(DevtoolsEventType.PageFrameAttached).toBe('Page.frameAttached')
  expect(DevtoolsEventType.PageFrameDetached).toBe('Page.frameDetached')
  expect(DevtoolsEventType.PageScreencastFrame).toBe('Page.screencastFrame')
})

test('DevtoolsEventType exports runtime constants', () => {
  expect(DevtoolsEventType.RuntimeConsoleApiCalled).toBe('Runtime.consoleAPICalled')
  expect(DevtoolsEventType.RuntimeExecutionContextCreated).toBe('Runtime.executionContextCreated')
})

test('DevtoolsEventType exports target constants', () => {
  expect(DevtoolsEventType.TargetAttachedToTarget).toBe('Target.attachedToTarget')
  expect(DevtoolsEventType.TargetDetachedFromTarget).toBe('Target.detachedFromTarget')
})
