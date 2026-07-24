import { expect, test } from '@jest/globals'
import { getInterleavedOrder, parseWorkCounts } from '../src/Runner.ts'

test('interleaved order contains complementary balanced blocks', () => {
  const order = getInterleavedOrder(20, 1234)

  expect(order).toHaveLength(80)
  for (let blockIndex = 0; blockIndex < 20; blockIndex++) {
    const block = order.filter((entry) => entry.blockIndex === blockIndex)
    const labels = block.map(({ label }) => label)
    expect([
      ['baseline', 'candidate', 'candidate', 'baseline'],
      ['candidate', 'baseline', 'baseline', 'candidate'],
    ]).toContainEqual(labels)
    expect(block.map(({ blockPosition }) => blockPosition)).toEqual([0, 1, 2, 3])
  }
  expect(order.filter(({ label }) => label === 'baseline')).toHaveLength(40)
  expect(order.filter(({ label }) => label === 'candidate')).toHaveLength(40)
})

test('work counts aggregate source-mapped locations by original source file', () => {
  const functions = parseWorkCounts(
    {
      trackedFunctions: [
        {
          delta: 3,
          originalLocation: 'src/vs/editor/example.ts:10:2',
          originalSource: 'src/vs/editor/example.ts',
        },
        {
          delta: 4,
          originalLocation: 'src/vs/editor/example.ts:20:4',
          originalSource: 'src/vs/editor/example.ts',
        },
      ],
    },
    'functions',
  )

  expect(functions).toEqual({
    'src/vs/editor/example.ts': 7,
  })
})
