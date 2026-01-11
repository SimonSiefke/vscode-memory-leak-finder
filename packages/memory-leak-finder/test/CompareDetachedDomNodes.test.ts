import { test, expect } from '@jest/globals'
import * as CompareDetachedDomNodes from '../src/parts/CompareDetachedDomNodes/CompareDetachedDomNodes.ts'

test('compareDetachedDomNodes', () => {
  const before = [
    {
      className: 'HTMLDivElement',
      description: 'div.suggest-details-container',
      objectId: '176284214236161929.4.4',
      subtype: 'node',
      type: 'object',
    },
  ]
  const after = [
    {
      className: 'HTMLDivElement',
      description: 'div.suggest-details-container',
      objectId: '176284214236161929.4.4',
      subtype: 'node',
      type: 'object',
    },
    {
      className: 'HTMLDivElement',
      description: 'div.editor-widget.suggest-widget.no-icons',
      objectId: '176284214236161929.4.5',
      subtype: 'node',
      type: 'object',
    },
  ]
  expect(CompareDetachedDomNodes.compareDetachedDomNodes(before, after)).toEqual({
    after: [
      {
        className: 'HTMLDivElement',
        count: 1,
        description: 'div.suggest-details-container',
      },
      {
        className: 'HTMLDivElement',
        count: 1,
        description: 'div.editor-widget.suggest-widget.no-icons',
      },
    ],
    before: [
      {
        className: 'HTMLDivElement',
        count: 1,
        description: 'div.suggest-details-container',
      },
    ],
  })
})
