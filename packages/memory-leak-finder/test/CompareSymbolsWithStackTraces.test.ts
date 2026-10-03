import { expect, test } from '@jest/globals'
import * as CompareSymbolsWithStackTraces from '../src/parts/CompareSymbolsWithStackTraces/CompareSymbolsWithStackTraces.ts'

test('groups retained symbols by description and creation stack', () => {
  const after = [
    {
      description: 'command',
      name: 'Symbol(command)',
      registered: false,
      stackTrace: 'createCommand (workbench.js:1:2)\nrunTest (test.js:3:4)',
    },
    {
      description: 'command',
      name: 'Symbol(command)',
      registered: false,
      stackTrace: 'createCommand (workbench.js:1:2)\nrunTest (test.js:3:4)',
    },
  ]

  expect(CompareSymbolsWithStackTraces.compareSymbolsWithStackTraces([], after)).toEqual([
    {
      count: 2,
      delta: 2,
      description: 'command',
      name: 'Symbol(command)',
      registered: false,
      stackTrace: ['createCommand (workbench.js:1:2)', 'runTest (test.js:3:4)'],
    },
  ])
})

test('only reports symbol stacks that grow with every run', () => {
  const after = [
    {
      description: 'one-time',
      name: 'Symbol(one-time)',
      registered: false,
      stackTrace: 'createOneTimeSymbol (workbench.js:1:2)',
    },
    ...Array.from({ length: 3 }, () => ({
      description: 'leaked',
      name: 'Symbol(leaked)',
      registered: false,
      stackTrace: 'createLeakedSymbol (workbench.js:3:4)',
    })),
  ]

  expect(CompareSymbolsWithStackTraces.compareSymbolsWithStackTraces([], after, { runs: 3 })).toEqual([
    {
      count: 3,
      delta: 3,
      description: 'leaked',
      name: 'Symbol(leaked)',
      registered: false,
      stackTrace: ['createLeakedSymbol (workbench.js:3:4)'],
    },
  ])
})
