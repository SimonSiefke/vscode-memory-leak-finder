import { expect, test } from '@jest/globals'
import { commitLabel, parseCommitReference } from '../src/parts/CommitReference/CommitReference.ts'
import { parseCommits } from '../src/parts/Series/Series.ts'

const sha = 'a'.repeat(40)

test('qualified commits retain repository identity and adapt to the existing fork build syntax', () => {
  expect(parseCommitReference(`SimonSiefke/VSCode@${sha.toUpperCase()}`)).toEqual({
    reference: `simonsiefke/vscode@${sha}`,
    sha,
    owner: 'simonsiefke',
    buildReference: `simonsiefke/${sha}`,
    artifact: `simonsiefke-vscode-${sha}`,
  })
  expect(parseCommitReference(`microsoft/vscode@${sha}`).buildReference).toBe(sha)
  expect(parseCommitReference(sha).artifact).toBe(sha)
  expect(commitLabel(`simonsiefke/vscode@${sha}`)).toBe(`simonsiefke/vscode@${sha.slice(0, 10)}`)
  expect(parseCommits(JSON.stringify([sha, `simonsiefke/vscode@${sha}`]))).toEqual([sha, `simonsiefke/vscode@${sha}`])
  expect(() => parseCommits(JSON.stringify([sha, `Microsoft/vscode@${sha}`]))).toThrow('unique')
})

test.each([
  'simonsiefke/vscode@main',
  `simonsiefke/other@${sha}`,
  `../vscode@${sha}`,
  `https://github.com/simonsiefke/vscode@${sha}`,
  `simonsiefke/${sha}`,
  `simonsiefke/vscode@${sha}\n`,
  `owner/vscode@${sha}/suffix`,
  'abc',
])('rejects invalid or ambiguous commit reference %s', (value) => {
  expect(() => parseCommitReference(value)).toThrow('Commit must be')
})
