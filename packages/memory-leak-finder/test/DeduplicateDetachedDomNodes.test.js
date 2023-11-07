import * as DeduplicateDetachedDomNodes from '../src/parts/DeduplicateDetachedDomNodes/DeduplicateDetachedDomNodes.js'

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
      type: 'object',
      subtype: 'node',
      className: 'HTMLAnchorElement',
      description: 'a.action-label.codicon.codicon-references',
      count: 2,
    },
  ])
})
