import { test, expect } from '@jest/globals'
import * as DeduplicateDetachedDomNodes from '../src/parts/DeduplicateDetachedDomNodes/DeduplicateDetachedDomNodes.ts'

test('deduplicateDetachedDomNodes', () => {
  const detachedDomNodes = [
    {
      className: 'HTMLAnchorElement',
      description: 'a.action-label.codicon.codicon-references',
      subtype: 'node',
      type: 'object',
    },
    {
      className: 'HTMLAnchorElement',
      description: 'a.action-label.codicon.codicon-references',
      subtype: 'node',
      type: 'object',
    },
  ]
  expect(DeduplicateDetachedDomNodes.deduplicatedDetachedDomNodes(detachedDomNodes)).toEqual([
    {
      className: 'HTMLAnchorElement',
      count: 2,
      description: 'a.action-label.codicon.codicon-references',
    },
  ])
})
