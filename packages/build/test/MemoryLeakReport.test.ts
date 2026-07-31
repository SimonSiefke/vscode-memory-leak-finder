import { expect, test } from '@jest/globals'
import {
  createMemoryLeakReportData,
  DEFAULT_IGNORED_REPOSITORIES,
  isRepositoryIgnored,
  parseMemoryLeakReportArgs,
  selectRepositories,
  sortRepositoryResults,
  type RepositoryCandidate,
  type RepositoryIssueResult,
} from '../src/memoryLeakReport.ts'
import { renderMemoryLeakReport } from '../src/memoryLeakReportHtml.ts'

const createRepository = (nameWithOwner: string, stars: number, hasPackageJson = true): RepositoryCandidate => {
  return {
    nameWithOwner,
    name: nameWithOwner.split('/')[1] || nameWithOwner,
    url: `https://github.com/${nameWithOwner}`,
    description: `${nameWithOwner} description`,
    stargazerCount: stars,
    forkCount: 10,
    primaryLanguage: {
      name: 'TypeScript',
      color: '#3178c6',
    },
    repositoryTopics: {
      nodes: [{ topic: { name: 'nodejs' } }],
    },
    packageJson: hasPackageJson ? { __typename: 'Blob' } : null,
  }
}

const createResult = (repository: RepositoryCandidate, openCount: number, closedCount: number): RepositoryIssueResult => {
  return {
    repository,
    openCount,
    closedCount,
    openIssues: [],
    closedIssues: [],
  }
}

test('parseMemoryLeakReportArgs parses report limits and keeps explicit repositories when defaults are disabled', () => {
  const options = parseMemoryLeakReportArgs([
    '--min-stars=1000',
    '--max-repos',
    '25',
    '--issues-per-state=10',
    '--request-delay-ms=1000',
    '--repo',
    'example/tool',
    '--no-seed-repos',
  ])

  expect(options).toMatchObject({
    minStars: 1000,
    maxRepositories: 25,
    issuesPerState: 10,
    requestDelayMs: 1000,
    seedRepositories: ['example/tool'],
    ignoredRepositories: DEFAULT_IGNORED_REPOSITORIES,
  })
})

test('parseMemoryLeakReportArgs rejects malformed repositories', () => {
  expect(() => parseMemoryLeakReportArgs(['--repo', 'missing-owner'])).toThrow('expected owner/name')
})

test('parseMemoryLeakReportArgs can disable the default repository denylist', () => {
  expect(parseMemoryLeakReportArgs(['--include-ignored']).ignoredRepositories).toEqual([])
})

test('parseMemoryLeakReportArgs permits disabling request pacing', () => {
  expect(parseMemoryLeakReportArgs(['--request-delay-ms=0']).requestDelayMs).toBe(0)
})

test('isRepositoryIgnored matches owners and repository names without case or punctuation sensitivity', () => {
  expect(isRepositoryIgnored('openclaw/openclaw', DEFAULT_IGNORED_REPOSITORIES)).toBe(true)
  expect(isRepositoryIgnored('vercel/next.js', DEFAULT_IGNORED_REPOSITORIES)).toBe(true)
  expect(isRepositoryIgnored('modelcontextprotocol/typescript-sdk', DEFAULT_IGNORED_REPOSITORIES)).toBe(true)
  expect(isRepositoryIgnored('coder/code-server', DEFAULT_IGNORED_REPOSITORIES)).toBe(true)
  expect(isRepositoryIgnored('nestjs/nest', DEFAULT_IGNORED_REPOSITORIES)).toBe(true)
  expect(isRepositoryIgnored('facebook/docusaurus', DEFAULT_IGNORED_REPOSITORIES)).toBe(false)
})

test('selectRepositories prioritizes seeds, requires package.json for discovery, and deduplicates repositories', () => {
  const seed = createRepository('example/seed', 50)
  const discovered = [
    createRepository('example/popular', 20_000),
    createRepository('example/no-package', 30_000, false),
    createRepository('EXAMPLE/SEED', 50),
    createRepository('example/too-small', 500),
  ]

  expect(
    selectRepositories(discovered, [seed], { ignoredRepositories: [], maxRepositories: 3, minStars: 1000 }).map(
      (repository) => repository.nameWithOwner,
    ),
  ).toEqual(['example/seed', 'example/popular'])
})

test('selectRepositories excludes denied discoveries but permits an explicitly seeded repository', () => {
  const ignored = createRepository('vercel/next.js', 140_000)

  expect(
    selectRepositories([ignored], [], {
      ignoredRepositories: DEFAULT_IGNORED_REPOSITORIES,
      maxRepositories: 3,
      minStars: 1000,
    }),
  ).toEqual([])
  expect(
    selectRepositories([], [ignored], {
      ignoredRepositories: DEFAULT_IGNORED_REPOSITORIES,
      maxRepositories: 3,
      minStars: 1000,
    }),
  ).toEqual([ignored])
})

test('sortRepositoryResults ranks by total matches and then open matches', () => {
  const first = createResult(createRepository('example/first', 1_000), 4, 1)
  const second = createResult(createRepository('example/second', 2_000), 2, 5)
  const third = createResult(createRepository('example/third', 3_000), 5, 0)

  expect(sortRepositoryResults([first, second, third]).map((result) => result.repository.nameWithOwner)).toEqual([
    'example/second',
    'example/third',
    'example/first',
  ])
})

test('createMemoryLeakReportData aggregates exact search counts', () => {
  const repositories = [
    createResult(createRepository('example/one', 1_000), 2, 3),
    createResult(createRepository('example/two', 2_000), 0, 0),
  ]

  expect(createMemoryLeakReportData(repositories, { minStars: 1_000 }, '2026-07-31T00:00:00.000Z')).toMatchObject({
    generatedAt: '2026-07-31T00:00:00.000Z',
    repositoryCount: 2,
    repositoriesWithMatches: 1,
    openIssueCount: 2,
    closedIssueCount: 3,
  })
})

test('renderMemoryLeakReport embeds data safely in a self-contained dashboard', () => {
  const repository = createRepository('example/repo', 1_000)
  Object.assign(repository, { description: '</script><script>alert(1)</script>' })
  const report = createMemoryLeakReportData([createResult(repository, 1, 0)], { minStars: 1_000 }, '2026-07-31T00:00:00.000Z')
  const html = renderMemoryLeakReport(report)

  expect(html).toContain('<!doctype html>')
  expect(html).toContain('Memory-leak issue radar')
  expect(html).toContain('\\u003c/script>')
  expect(html).not.toContain('</script><script>alert(1)</script>')
})
