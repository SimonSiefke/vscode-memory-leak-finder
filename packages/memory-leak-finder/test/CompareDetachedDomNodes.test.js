import * as CompareDetachedDomNodes from '../src/parts/CompareDetachedDomNodes/CompareDetachedDomNodes.js'
import { test, expect } from '@jest/globals'

test('compareDetachedDomNodes', () => {
  const before = [
    {
      type: 'object',
      subtype: 'node',
      className: 'HTMLDivElement',
      description: 'div.suggest-details-container',
      objectId: '176284214236161929.4.4',
    },
  ]
  const after = [
    {
      type: 'object',
      subtype: 'node',
      className: 'HTMLDivElement',
      description: 'div.suggest-details-container',
      objectId: '176284214236161929.4.4',
    },
    {
      type: 'object',
      subtype: 'node',
      className: 'HTMLDivElement',
      description: 'div.editor-widget.suggest-widget.no-icons',
      objectId: '176284214236161929.4.5',
    },
  ]
  expect(CompareDetachedDomNodes.compareDetachedDomNodes(before, after)).toEqual({
    before: [
      {
        className: 'HTMLDivElement',
        description: 'div.suggest-details-container',
        count: 1,
      },
    ],
    after: [
      {
        className: 'HTMLDivElement',
        description: 'div.suggest-details-container',
        count: 1,
      },
      {
        className: 'HTMLDivElement',
        description: 'div.editor-widget.suggest-widget.no-icons',
        count: 1,
      },
    ],
  })
})
