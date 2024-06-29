import * as DeduplicateDetachedDomNodes from '../src/parts/DeduplicateDetachedDomNodes/DeduplicateDetachedDomNodes.js'
import {test, expect} from '@jest/globals'

test('deduplicateDetachedDomNodes', () => {
  const detachedDomNodes = [
    {
      type: 'object',
      subtype: 'node',
      className: 'HTMLAnchorElement',
      description: 'a.action-label.codicon.codicon-references',
    },
    {
      type: 'object',
      subtype: 'node',
      className: 'HTMLAnchorElement',
      description: 'a.action-label.codicon.codicon-references',
    },
  ]
  expect(DeduplicateDetachedDomNodes.deduplicatedDetachedDomNodes(detachedDomNodes)).toEqual([
    {
      className: 'HTMLAnchorElement',
      description: 'a.action-label.codicon.codicon-references',
      count: 2,
    },
  ])
})
