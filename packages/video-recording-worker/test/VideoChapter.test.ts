import { expect, test } from '@jest/globals'
import * as VideoChapter from '../src/parts/VideoChapter/VideoChapter.ts'

test('initial state has empty chapters array', () => {
  expect(Array.isArray(VideoChapter.state.chapters)).toBe(true)
  expect(VideoChapter.state.chapters.length).toBe(0)
})

test('addChapter adds chapter to state', () => {
  // Reset state for this test
  VideoChapter.state.chapters = []
  
  const chapterName = 'Test Chapter'
  const chapterTime = 1234
  
  VideoChapter.addChapter(chapterName, chapterTime)
  
  expect(VideoChapter.state.chapters.length).toBe(1)
  expect(VideoChapter.state.chapters[0].name).toBe(chapterName)
  expect(VideoChapter.state.chapters[0].time).toBe(chapterTime)
})

test('addChapter adds multiple chapters', () => {
  // Reset state for this test
  VideoChapter.state.chapters = []
  
  VideoChapter.addChapter('Chapter 1', 100)
  VideoChapter.addChapter('Chapter 2', 200)
  VideoChapter.addChapter('Chapter 3', 300)
  
  expect(VideoChapter.state.chapters.length).toBe(3)
  expect(VideoChapter.state.chapters[1].name).toBe('Chapter 2')
  expect(VideoChapter.state.chapters[2].time).toBe(300)
})
