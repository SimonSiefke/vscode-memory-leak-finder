import { expect, test } from '@jest/globals'
import * as GetGitHubGroupStartMessage from '../src/parts/GetGitHubGroupStartMessage/GetGitHubGroupStartMessage.ts'
import * as GetGitHubGroupEndMessage from '../src/parts/GetGitHubGroupEndMessage/GetGitHubGroupEndMessage.ts'
import * as GetGitHubFileErrorMessage from '../src/parts/GetGitHubFileErrorMessage/GetGitHubFileErrorMessage.ts'

test('group start', () => {
  expect(GetGitHubGroupStartMessage.getGitHubGroupStartMessage('Build Logs')).toBe('::group::Build Logs\n')
})

test('group end', () => {
  expect(GetGitHubGroupEndMessage.getGitHubGroupEndMessage()).toBe('::endgroup::\n')
})

test('file error minimal', () => {
  expect(
    GetGitHubFileErrorMessage.getGitHubFileErrorMessage('Something went wrong', {
      file: 'packages/stdout-worker/src/index.ts',
    }),
  ).toBe('::error file=packages/stdout-worker/src/index.ts::Something went wrong\n')
})

test('file error with position and title', () => {
  expect(
    GetGitHubFileErrorMessage.getGitHubFileErrorMessage('Parse failed', {
      file: 'src/file.ts',
      line: 12,
      col: 5,
      title: 'Parser Error',
    }),
  ).toBe('::error file=src/file.ts,line=12,col=5,title=Parser Error::Parse failed\n')
})

test('file error escaping', () => {
  expect(
    GetGitHubFileErrorMessage.getGitHubFileErrorMessage('Line1\nLine2', {
      file: 'src/file.ts',
      line: 1,
      title: 'Bad\nTitle',
    }),
  ).toBe('::error file=src/file.ts,line=1,title=Bad%0ATitle::Line1%0ALine2\n')
})


