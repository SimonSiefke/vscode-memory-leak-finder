import * as PrettifyInstanceCounts from '../src/parts/PrettifyInstanceCounts/PrettifyInstanceCounts.js'
import { test, expect } from '@jest/globals'

test('prettifyInstanceCounts', () => {
  const instances = [
    {
      name: 'class extends Action2',
      count: 2,
    },
    {
      name: 'class extends Action2',
      count: 2,
    },
    {
      name: 'TextSearchQuickAccessAction',
      count: 2,
    },
    {
      name: 'class extends Action2',
      count: 2,
    },
  ]
  expect(PrettifyInstanceCounts.prettifyInstanceCounts(instances)).toEqual([
    {
      name: 'class extends Action2',
      count: 2,
    },
    {
      name: 'class extends Action2',
      count: 2,
    },
    {
      name: 'class extends Action2',
      count: 2,
    },
    {
      name: 'TextSearchQuickAccessAction',
      count: 2,
    },
  ])
})
