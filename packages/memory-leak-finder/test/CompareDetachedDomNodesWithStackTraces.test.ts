import { test, expect } from '@jest/globals'
import * as CompareDetachedDomNodesWithStackTraces from '../src/parts/CompareDetachedDomNodesWithStackTraces/CompareDetachedDomNodesWithStackTraces.ts'

test('compareDetachedDomNodesWithStackTraces - no nodes', () => {
  const before: any[] = []
  const after: any[] = []
  const result = CompareDetachedDomNodesWithStackTraces.compareDetachedDomNodesWithStackTraces(before, after)
  expect(result).toEqual({
    after: [],
  })
})

test('compareDetachedDomNodesWithStackTraces - single new node', () => {
  const before: any[] = []
  const after: any[] = [
    {
      className: 'HTMLDivElement',
      description: 'div.container',
    },
  ]
  const result = CompareDetachedDomNodesWithStackTraces.compareDetachedDomNodesWithStackTraces(before, after)
  expect(result).toEqual({
    after: [
      {
        className: 'HTMLDivElement',
        description: 'div.container',
        count: 1,
        delta: 1,
      },
    ],
  })
})

test('compareDetachedDomNodesWithStackTraces - node with delta less than runs', () => {
  const before: any[] = [
    {
      className: 'HTMLDivElement',
      description: 'div.container',
    },
  ]
  const after: any[] = [
    {
      className: 'HTMLDivElement',
      description: 'div.container',
    },
  ]
  const result = CompareDetachedDomNodesWithStackTraces.compareDetachedDomNodesWithStackTraces(before, after, { runs: 2 })
  expect(result).toEqual({
    after: [],
  })
})

test('compareDetachedDomNodesWithStackTraces - multiple nodes with different deltas', () => {
  const before: any[] = [
    {
      className: 'HTMLDivElement',
      description: 'div.container',
    },
    {
      className: 'HTMLSpanElement',
      description: 'span.text',
    },
  ]
  const after: any[] = [
    {
      className: 'HTMLDivElement',
      description: 'div.container',
    },
    {
      className: 'HTMLDivElement',
      description: 'div.container',
    },
    {
      className: 'HTMLDivElement',
      description: 'div.container',
    },
    {
      className: 'HTMLSpanElement',
      description: 'span.text',
    },
  ]
  const result = CompareDetachedDomNodesWithStackTraces.compareDetachedDomNodesWithStackTraces(before, after)
  expect(result.after).toHaveLength(1)
  expect(result.after[0]).toMatchObject({
    className: 'HTMLDivElement',
    description: 'div.container',
    count: 3,
    delta: 2,
  })
})

test('compareDetachedDomNodesWithStackTraces - sorted by delta descending', () => {
  const before: any[] = []
  const after: any[] = [
    {
      className: 'HTMLDivElement',
      description: 'div.a',
    },
    {
      className: 'HTMLDivElement',
      description: 'div.a',
    },
    {
      className: 'HTMLSpanElement',
      description: 'span.b',
    },
    {
      className: 'HTMLSpanElement',
      description: 'span.b',
    },
    {
      className: 'HTMLSpanElement',
      description: 'span.b',
    },
    {
      className: 'HTMLPElement',
      description: 'p.c',
    },
  ]
  const result = CompareDetachedDomNodesWithStackTraces.compareDetachedDomNodesWithStackTraces(before, after)
  expect(result.after).toHaveLength(3)
  // Should be sorted by delta descending
  expect(result.after[0].delta).toBe(3)
  expect(result.after[1].delta).toBe(2)
  expect(result.after[2].delta).toBe(1)
})

test('compareDetachedDomNodesWithStackTraces - with context runs', () => {
  const after: any[] = [
    {
      className: 'HTMLDivElement',
      description: 'div.a',
    },
    {
      className: 'HTMLDivElement',
      description: 'div.a',
    },
    {
      className: 'HTMLSpanElement',
      description: 'span.b',
    },
    {
      className: 'HTMLSpanElement',
      description: 'span.b',
    },
  ]
  const result = CompareDetachedDomNodesWithStackTraces.compareDetachedDomNodesWithStackTraces(after, after, {
    runs: 3,
  })
  expect(result.after).toHaveLength(0)
})

test('compareDetachedDomNodesWithStackTraces - preserves additional node properties', () => {
  const before: any[] = []
  const after: any[] = [
    {
      className: 'HTMLDivElement',
      description: 'div.container',
      objectId: '123456.1',
      subtype: 'node',
      type: 'object',
      customProp: 'customValue',
    },
  ]
  const result = CompareDetachedDomNodesWithStackTraces.compareDetachedDomNodesWithStackTraces(before, after)
  expect(result.after[0]).toMatchObject({
    className: 'HTMLDivElement',
    description: 'div.container',
    customProp: 'customValue',
    count: 1,
    delta: 1,
  })
})

test('compareDetachedDomNodesWithStackTraces - complex scenario with multiple differences', () => {
  const before: any[] = [
    {
      className: 'HTMLDivElement',
      description: 'div.container',
    },
    {
      className: 'HTMLDivElement',
      description: 'div.container',
    },
    {
      className: 'HTMLSpanElement',
      description: 'span.text',
    },
  ]
  const after: any[] = [
    {
      className: 'HTMLDivElement',
      description: 'div.container',
    },
    {
      className: 'HTMLDivElement',
      description: 'div.container',
    },
    {
      className: 'HTMLDivElement',
      description: 'div.container',
    },
    {
      className: 'HTMLSpanElement',
      description: 'span.text',
    },
  ]
  const result = CompareDetachedDomNodesWithStackTraces.compareDetachedDomNodesWithStackTraces(before, after)
  expect(result.after).toHaveLength(1)
  expect(result.after[0]).toMatchObject({
    className: 'HTMLDivElement',
    description: 'div.container',
    count: 3,
    delta: 1,
  })
})

test('compareDetachedDomNodesWithStackTraces - runs with default value of 1', () => {
  const after: any[] = [
    {
      className: 'HTMLDivElement',
      description: 'div.container',
    },
  ]
  const result = CompareDetachedDomNodesWithStackTraces.compareDetachedDomNodesWithStackTraces([], after, {})
  expect(result.after).toHaveLength(1)
  expect(result.after[0].delta).toBe(1)
})
