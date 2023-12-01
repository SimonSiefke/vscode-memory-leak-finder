import * as CleanEventListenerCount from '../src/parts/CleanEventListenerCount/CleanEventListenerCount.js'

test('cleanEventListenerCount', () => {
  expect(
    CleanEventListenerCount.cleanEventListenerCount([
      {
        name: 'SoundSource',
        count: 24,
      },
      {
        name: 'AudioCue',
        count: 24,
      },
    ]),
  ).toEqual([
    {
      name: 'AudioCue',
      count: 24,
    },
    {
      name: 'SoundSource',
      count: 24,
    },
  ])
})
