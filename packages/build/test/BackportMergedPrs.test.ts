import { expect, test } from '@jest/globals'
import {
  createBackportBody,
  createBackportBranchName,
  getBackportSkipReason,
  parseBackportedPrNumbers,
  selectNextBackportPullRequest,
  sortMergedPullRequests,
  type BackportState,
  type MergedPullRequest,
} from '../src/backportMergedPrs.ts'

const upstreamRepo = 'SimonSiefke/vscode-memory-leak-finder-3'

const createPullRequest = (overrides: Partial<MergedPullRequest>): MergedPullRequest => {
  const number = overrides.number ?? 1
  return {
    number,
    title: overrides.title ?? `Pull Request ${number}`,
    mergedAt: overrides.mergedAt ?? '2026-06-26T21:00:00Z',
    url: overrides.url ?? `https://github.com/${upstreamRepo}/pull/${number}`,
    headRefName: overrides.headRefName ?? `branch-${number}`,
    mergeCommit: overrides.mergeCommit ?? {
      oid: `merge-commit-${number}`,
    },
  }
}

const createState = (overrides: Partial<BackportState> = {}): BackportState => {
  return {
    backportedPrNumbers: overrides.backportedPrNumbers ?? new Set(),
    remoteBranches: overrides.remoteBranches ?? new Set(),
    openPullRequestBranches: overrides.openPullRequestBranches ?? new Set(),
  }
}

test('sortMergedPullRequests sorts oldest first', () => {
  const newest = createPullRequest({ number: 3, mergedAt: '2026-06-26T23:00:00Z' })
  const oldest = createPullRequest({ number: 1, mergedAt: '2026-06-26T21:00:00Z' })
  const middle = createPullRequest({ number: 2, mergedAt: '2026-06-26T22:00:00Z' })

  expect(sortMergedPullRequests([newest, oldest, middle]).map((pullRequest) => pullRequest.number)).toEqual([1, 2, 3])
})

test('createBackportBranchName creates a stable branch slug', () => {
  const pullRequest = createPullRequest({
    number: 42,
    title: 'Fix: A Great Thing!',
  })

  expect(createBackportBranchName(pullRequest)).toBe('backport/upstream-42-fix-a-great-thing')
})

test('createBackportBody includes repeatable upstream markers', () => {
  const pullRequest = createPullRequest({
    number: 9,
    title: 'feature: update default chat model',
    mergeCommit: {
      oid: 'b745a485494bb260f5bfbb67f5bb9fc832fa1fe3',
    },
  })

  expect(createBackportBody(pullRequest, { upstreamRepo })).toBe(
    [
      'Backport of https://github.com/SimonSiefke/vscode-memory-leak-finder-3/pull/9',
      '',
      'Backport-Upstream-PR: SimonSiefke/vscode-memory-leak-finder-3#9',
      'Backport-Upstream-URL: https://github.com/SimonSiefke/vscode-memory-leak-finder-3/pull/9',
      'Backport-Upstream-Merge-Commit: b745a485494bb260f5bfbb67f5bb9fc832fa1fe3',
    ].join('\n'),
  )
})

test('parseBackportedPrNumbers finds upstream markers in git log output', () => {
  const gitLog = [
    'feature: update default chat model',
    '',
    'Backport-Upstream-PR: SimonSiefke/vscode-memory-leak-finder-3#9',
    'Backport-Upstream-PR: SimonSiefke/vscode-memory-leak-finder-3#12',
    'Backport-Upstream-PR: SimonSiefke/other-repo#99',
  ].join('\n')

  expect(parseBackportedPrNumbers(gitLog, upstreamRepo)).toEqual(new Set([9, 12]))
})

test('getBackportSkipReason detects already backported pull requests', () => {
  const pullRequest = createPullRequest({ number: 4 })
  const candidate = {
    pullRequest,
    branchName: createBackportBranchName(pullRequest),
  }

  expect(getBackportSkipReason(candidate, createState({ backportedPrNumbers: new Set([4]) }), upstreamRepo)).toBe('already-backported')
})

test('getBackportSkipReason detects existing remote branches', () => {
  const pullRequest = createPullRequest({ number: 5, title: 'Add typed ChatEditor models' })
  const candidate = {
    pullRequest,
    branchName: createBackportBranchName(pullRequest),
  }

  expect(getBackportSkipReason(candidate, createState({ remoteBranches: new Set([candidate.branchName]) }), upstreamRepo)).toBe(
    'remote-branch-exists',
  )
})

test('getBackportSkipReason detects existing open pull requests', () => {
  const pullRequest = createPullRequest({ number: 6, title: 'add auto chat model' })
  const candidate = {
    pullRequest,
    branchName: createBackportBranchName(pullRequest),
  }

  expect(getBackportSkipReason(candidate, createState({ openPullRequestBranches: new Set([candidate.branchName]) }), upstreamRepo)).toBe(
    'open-pull-request-exists',
  )
})

test('selectNextBackportPullRequest returns the oldest missing pull request', () => {
  const alreadyBackported = createPullRequest({
    number: 1,
    mergedAt: '2026-06-26T21:00:00Z',
  })
  const existingBranch = createPullRequest({
    number: 2,
    title: 'Existing Branch',
    mergedAt: '2026-06-26T22:00:00Z',
  })
  const selected = createPullRequest({
    number: 3,
    title: 'Selected Change',
    mergedAt: '2026-06-26T23:00:00Z',
  })

  const candidate = selectNextBackportPullRequest(
    [selected, existingBranch, alreadyBackported],
    createState({
      backportedPrNumbers: new Set([alreadyBackported.number]),
      remoteBranches: new Set([createBackportBranchName(existingBranch)]),
    }),
    upstreamRepo,
  )

  expect(candidate).toEqual({
    pullRequest: selected,
    branchName: 'backport/upstream-3-selected-change',
  })
})
