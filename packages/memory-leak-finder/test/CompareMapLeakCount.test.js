import * as CompareMapLeakCount from '../src/parts/CompareMapLeakCount/CompareMapLeakCount.js'

test('compareMapLeakCount', () => {
  const before = [
    {
      name: 'Location',
      count: 0,
      objectId: '176284214236161929.4.4',
    },
  ]
  const after = [
    {
      name: 'Location',
      count: 1,
      objectId: '176284214236161929.4.4',
    },
  ]
  const getKey = (value) => {
    return value.objectId
  }
  expect(CompareMapLeakCount.compareMapLeakCount(before, after, getKey)).toEqual({
    after: [
      {
        count: 1,
        name: 'Location',
        objectId: '176284214236161929.4.4',
      },
    ],
    before: [
      {
        count: 0,
        name: 'Location',
        objectId: '176284214236161929.4.4',
      },
    ],
    leaked: [
      {
        afterCount: 1,
        beforeCount: 0,
        name: 'Location',
      },
    ],
    map: {
      '176284214236161929.4.4': 0,
    },
  })
})
