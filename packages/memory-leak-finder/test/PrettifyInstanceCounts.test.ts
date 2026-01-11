import { test, expect } from '@jest/globals'
import * as PrettifyInstanceCounts from '../src/parts/PrettifyInstanceCounts/PrettifyInstanceCounts.ts'

test('prettifyInstanceCounts', () => {
  const instances = [
    {
      count: 2,
      name: 'class extends Action2',
    },
    {
      count: 2,
      name: 'class extends Action2',
    },
    {
      count: 2,
      name: 'TextSearchQuickAccessAction',
    },
    {
      count: 2,
      name: 'class extends Action2',
    },
  ]
  expect(PrettifyInstanceCounts.prettifyInstanceCounts(instances)).toEqual([
    {
      count: 2,
      name: 'class extends Action2',
    },
    {
      count: 2,
      name: 'class extends Action2',
    },
    {
      count: 2,
      name: 'class extends Action2',
    },
    {
      count: 2,
      name: 'TextSearchQuickAccessAction',
    },
  ])
})
