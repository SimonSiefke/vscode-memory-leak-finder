import { expect, test } from '@jest/globals'
import { createCommentMarker, parseCommentMarker } from '../src/parts/CommentMarker/CommentMarker.ts'

test('createCommentMarker and parseCommentMarker round-trip metadata', () => {
  const marker = createCommentMarker({
    requestId: 'measure-run-123-456',
    sourceRepository: 'microsoft/vscode',
    statusCommentId: 999,
  })

  expect(marker).toContain('vscode-memory-leak-finder:')
  expect(parseCommentMarker(marker)).toEqual({
    requestId: 'measure-run-123-456',
    sourceRepository: 'microsoft/vscode',
    statusCommentId: 999,
  })
})

test('parseCommentMarker returns undefined for unrelated comments', () => {
  expect(parseCommentMarker('plain comment')).toBeUndefined()
})
