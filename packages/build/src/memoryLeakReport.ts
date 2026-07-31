import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { renderMemoryLeakReport } from './memoryLeakReportHtml.ts'

export const DEFAULT_MIN_STARS = 5_000
export const DEFAULT_MAX_REPOSITORIES = 50
export const DEFAULT_ISSUES_PER_STATE = 20
export const DEFAULT_SEED_REPOSITORIES = ['facebook/docusaurus', 'web-infra-dev/rspack'] as const
export const DEFAULT_IGNORED_REPOSITORIES = [
  'openclaw',
  'nextjs',
  'bun',
  'gemini-cli',
  'puppeteer',
  'claude-mem',
  'typescript',
  'axios',
  'create-react-app',
  'freecodecamp',
  'modelcontextprotocol',
  'gstack',
  'caveman',
  '30-seconds-of-code',
] as const

const root = join(import.meta.dirname, '../../..')
const defaultOutputPath = join(root, '.memory-leak-report/index.html')
const githubGraphqlUrl = 'https://api.github.com/graphql'
const issueBatchSize = 5
const repositoryBatchSize = 25
const retryableStatusCodes = new Set([502, 503, 504])

export interface MemoryLeakReportOptions {
  readonly minStars: number
  readonly maxRepositories: number
  readonly issuesPerState: number
  readonly outputPath: string
  readonly seedRepositories: readonly string[]
  readonly ignoredRepositories: readonly string[]
}

export interface RepositoryCandidate {
  readonly nameWithOwner: string
  readonly name: string
  readonly url: string
  readonly description: string | null
  readonly stargazerCount: number
  readonly forkCount: number
  readonly primaryLanguage: {
    readonly name: string
    readonly color: string | null
  } | null
  readonly repositoryTopics: {
    readonly nodes: readonly {
      readonly topic: {
        readonly name: string
      }
    }[]
  }
  readonly packageJson: {
    readonly __typename: string
  } | null
}

type RepositorySummary = Omit<RepositoryCandidate, 'packageJson' | 'repositoryTopics'>

export interface MemoryLeakIssue {
  readonly number: number
  readonly title: string
  readonly url: string
  readonly state: 'OPEN' | 'CLOSED'
  readonly createdAt: string
  readonly updatedAt: string
  readonly closedAt: string | null
  readonly bodyText: string
  readonly author: {
    readonly login: string
  } | null
  readonly labels: {
    readonly nodes: readonly {
      readonly name: string
      readonly color: string
    }[]
  }
  readonly comments: {
    readonly totalCount: number
  }
}

export interface RepositoryIssueResult {
  readonly repository: RepositoryCandidate
  readonly openCount: number
  readonly closedCount: number
  readonly openIssues: readonly MemoryLeakIssue[]
  readonly closedIssues: readonly MemoryLeakIssue[]
}

export interface MemoryLeakReportData {
  readonly generatedAt: string
  readonly searchPhrase: string
  readonly minStars: number
  readonly repositoryCount: number
  readonly repositoriesWithMatches: number
  readonly openIssueCount: number
  readonly closedIssueCount: number
  readonly repositories: readonly RepositoryIssueResult[]
}

interface SearchConnection<T> {
  readonly issueCount: number
  readonly nodes: readonly T[]
}

interface GraphqlResponse<T> {
  readonly data?: T
  readonly errors?: readonly {
    readonly message: string
  }[]
}

const parsePositiveInteger = (value: string, optionName: string, allowZero = false): number => {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < (allowZero ? 0 : 1)) {
    throw new Error(`${optionName} must be ${allowZero ? 'a non-negative' : 'a positive'} integer`)
  }
  return parsed
}

const parseOptionValue = (args: readonly string[], index: number, optionName: string): string => {
  const value = args[index + 1]
  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value for ${optionName}`)
  }
  return value
}

export const parseMemoryLeakReportArgs = (args: readonly string[]): MemoryLeakReportOptions => {
  let minStars = DEFAULT_MIN_STARS
  let maxRepositories = DEFAULT_MAX_REPOSITORIES
  let issuesPerState = DEFAULT_ISSUES_PER_STATE
  let outputPath = defaultOutputPath
  let includeDefaultSeeds = true
  let includeIgnoredRepositories = false
  const additionalRepositories: string[] = []

  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (arg === '--min-stars') {
      minStars = parsePositiveInteger(parseOptionValue(args, index, arg), arg, true)
      index++
    } else if (arg.startsWith('--min-stars=')) {
      minStars = parsePositiveInteger(arg.slice('--min-stars='.length), '--min-stars', true)
    } else if (arg === '--max-repos') {
      maxRepositories = parsePositiveInteger(parseOptionValue(args, index, arg), arg)
      index++
    } else if (arg.startsWith('--max-repos=')) {
      maxRepositories = parsePositiveInteger(arg.slice('--max-repos='.length), '--max-repos')
    } else if (arg === '--issues-per-state') {
      issuesPerState = parsePositiveInteger(parseOptionValue(args, index, arg), arg)
      index++
    } else if (arg.startsWith('--issues-per-state=')) {
      issuesPerState = parsePositiveInteger(arg.slice('--issues-per-state='.length), '--issues-per-state')
    } else if (arg === '--output') {
      outputPath = resolve(parseOptionValue(args, index, arg))
      index++
    } else if (arg.startsWith('--output=')) {
      outputPath = resolve(arg.slice('--output='.length))
    } else if (arg === '--repo') {
      additionalRepositories.push(parseOptionValue(args, index, arg))
      index++
    } else if (arg.startsWith('--repo=')) {
      additionalRepositories.push(arg.slice('--repo='.length))
    } else if (arg === '--no-seed-repos') {
      includeDefaultSeeds = false
    } else if (arg === '--include-ignored') {
      includeIgnoredRepositories = true
    } else if (arg === '--help') {
      printHelp()
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  const seedRepositories = [...(includeDefaultSeeds ? DEFAULT_SEED_REPOSITORIES : []), ...additionalRepositories]
  for (const repository of seedRepositories) {
    if (!/^[^/\s]+\/[^/\s]+$/.test(repository)) {
      throw new Error(`Invalid repository ${repository}; expected owner/name`)
    }
  }
  if (issuesPerState > 100) {
    throw new Error("--issues-per-state cannot exceed GitHub's limit of 100")
  }

  return {
    minStars,
    maxRepositories,
    issuesPerState,
    outputPath,
    seedRepositories: [...new Set(seedRepositories)],
    ignoredRepositories: includeIgnoredRepositories ? [] : DEFAULT_IGNORED_REPOSITORIES,
  }
}

const printHelp = (): void => {
  console.log(`Generate an HTML overview of memory-leak issues in popular Node.js repositories.

Usage: npm run memory-leak-report -- [options]

Options:
  --min-stars <number>        Minimum stars for discovered repositories (default: ${DEFAULT_MIN_STARS})
  --max-repos <number>        Maximum repositories to scan, including seeds (default: ${DEFAULT_MAX_REPOSITORIES})
  --issues-per-state <number> Issue cards retained per open/closed column (default: ${DEFAULT_ISSUES_PER_STATE})
  --output <path>             HTML output path (default: .memory-leak-report/index.html)
  --repo <owner/name>         Always include a repository; can be repeated
  --no-seed-repos             Do not include Docusaurus and Rspack automatically
  --include-ignored           Include repositories from the default denylist
  --help                      Show this help

Authentication uses GITHUB_TOKEN, GH_TOKEN, or the active gh CLI login.`)
}

export const selectRepositories = (
  discovered: readonly RepositoryCandidate[],
  seeds: readonly RepositoryCandidate[],
  options: Pick<MemoryLeakReportOptions, 'ignoredRepositories' | 'maxRepositories' | 'minStars'>,
): RepositoryCandidate[] => {
  const selected = new Map<string, RepositoryCandidate>()
  for (const repository of seeds) {
    if (repository.packageJson) {
      selected.set(repository.nameWithOwner.toLowerCase(), repository)
    }
  }
  const eligible = discovered
    .filter(
      (repository) =>
        repository.packageJson &&
        repository.stargazerCount >= options.minStars &&
        !isRepositoryIgnored(repository.nameWithOwner, options.ignoredRepositories),
    )
    .sort((a, b) => b.stargazerCount - a.stargazerCount || a.nameWithOwner.localeCompare(b.nameWithOwner))
  for (const repository of eligible) {
    if (selected.size >= options.maxRepositories) {
      break
    }
    selected.set(repository.nameWithOwner.toLowerCase(), repository)
  }
  return [...selected.values()].slice(0, options.maxRepositories)
}

const normalizeRepositoryName = (value: string): string => {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export const isRepositoryIgnored = (nameWithOwner: string, ignoredRepositories: readonly string[]): boolean => {
  const [owner = '', name = ''] = nameWithOwner.split('/')
  const normalizedOwner = normalizeRepositoryName(owner)
  const normalizedName = normalizeRepositoryName(name)
  return ignoredRepositories.some((ignoredRepository) => {
    if (ignoredRepository.includes('/')) {
      return normalizeRepositoryName(nameWithOwner) === normalizeRepositoryName(ignoredRepository)
    }
    const normalizedIgnoredRepository = normalizeRepositoryName(ignoredRepository)
    return normalizedOwner === normalizedIgnoredRepository || normalizedName === normalizedIgnoredRepository
  })
}

const getGithubToken = (): string => {
  const environmentToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  if (environmentToken) {
    return environmentToken
  }
  try {
    return execFileSync('gh', ['auth', 'token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    throw new Error('GitHub authentication required. Set GITHUB_TOKEN/GH_TOKEN or run gh auth login.')
  }
}

const graphql = async <T>(token: string, query: string): Promise<T> => {
  let response: Response | undefined
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await fetch(githubGraphqlUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'vscode-memory-leak-finder',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ query }),
    })
    if (response.ok || !retryableStatusCodes.has(response.status)) {
      break
    }
    await new Promise((resolveRetry) => setTimeout(resolveRetry, 500 * 2 ** attempt))
  }
  if (!response?.ok) {
    throw new Error(`GitHub GraphQL request failed: ${response?.status || 'unknown'} ${response?.statusText || ''}`.trim())
  }
  const result = (await response.json()) as GraphqlResponse<T>
  if (result.errors?.length) {
    throw new Error(`GitHub GraphQL error: ${result.errors.map((error) => error.message).join('; ')}`)
  }
  if (!result.data) {
    throw new Error('GitHub GraphQL response did not contain data')
  }
  return result.data
}

const repositorySummaryFields = `
  nameWithOwner
  name
  url
  description
  stargazerCount
  forkCount
  primaryLanguage { name color }
`

const repositoryFields = `
  ${repositorySummaryFields}
  repositoryTopics(first: 12) { nodes { topic { name } } }
  packageJson: object(expression: "HEAD:package.json") { __typename }
`

const discoverRepositories = async (
  token: string,
  maxRepositories: number,
  minStars: number,
  ignoredRepositories: readonly string[],
): Promise<RepositoryCandidate[]> => {
  const candidatesPerSearch = Math.min(100, Math.max(maxRepositories * 2, 50))
  const searches = [
    `language:JavaScript stars:>=${minStars} fork:false archived:false sort:stars-desc`,
    `language:TypeScript stars:>=${minStars} fork:false archived:false sort:stars-desc`,
    `topic:nodejs stars:>=${minStars} fork:false archived:false sort:stars-desc`,
  ]
  const repositories: RepositorySummary[] = []
  for (const search of searches) {
    const data = await graphql<{ readonly search: { readonly nodes: readonly RepositorySummary[] } }>(
      token,
      `query { search(query: ${JSON.stringify(search)}, type: REPOSITORY, first: ${candidatesPerSearch}) {
        nodes { ... on Repository { ${repositorySummaryFields} } }
      } }`,
    )
    repositories.push(...data.search.nodes)
  }
  const uniqueRepositories = new Map<string, RepositorySummary>()
  for (const repository of repositories) {
    uniqueRepositories.set(repository.nameWithOwner.toLowerCase(), repository)
  }
  const metadataCandidateCount = Math.min(uniqueRepositories.size, Math.max(maxRepositories * 3, 100))
  const names = [...uniqueRepositories.values()]
    .filter((repository) => !isRepositoryIgnored(repository.nameWithOwner, ignoredRepositories))
    .sort((a, b) => b.stargazerCount - a.stargazerCount)
    .slice(0, metadataCandidateCount)
    .map((repository) => repository.nameWithOwner)
  return loadRepositories(token, names)
}

const loadRepositories = async (token: string, repositories: readonly string[]): Promise<RepositoryCandidate[]> => {
  if (repositories.length === 0) {
    return []
  }
  const results: RepositoryCandidate[] = []
  for (let offset = 0; offset < repositories.length; offset += repositoryBatchSize) {
    const batch = repositories.slice(offset, offset + repositoryBatchSize)
    const fields = batch
      .map((repository, index) => {
        const [owner, name] = repository.split('/')
        return `repository${index}: repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) { ${repositoryFields} }`
      })
      .join('\n')
    const data = await graphql<Record<string, RepositoryCandidate | null>>(token, `query { ${fields} }`)
    results.push(...Object.values(data).filter((repository): repository is RepositoryCandidate => Boolean(repository)))
  }
  return results
}

const loadSeedRepositories = async (token: string, repositories: readonly string[]): Promise<RepositoryCandidate[]> => {
  const results = await loadRepositories(token, repositories)
  const found = new Set(results.map((repository) => repository.nameWithOwner.toLowerCase()))
  const missing = repositories.filter((repository) => !found.has(repository.toLowerCase()))
  if (missing.length > 0) {
    throw new Error(`Could not find seed repositories: ${missing.join(', ')}`)
  }
  return results
}

const issueFields = `
  number
  title
  url
  state
  createdAt
  updatedAt
  closedAt
  bodyText
  author { login }
  labels(first: 8) { nodes { name color } }
  comments { totalCount }
`

export const sortRepositoryResults = (repositories: readonly RepositoryIssueResult[]): RepositoryIssueResult[] => {
  return [...repositories].sort((a, b) => {
    const issueDifference = b.openCount + b.closedCount - (a.openCount + a.closedCount)
    return issueDifference || b.openCount - a.openCount || b.repository.stargazerCount - a.repository.stargazerCount
  })
}

const searchRepositoryIssues = async (
  token: string,
  repositories: readonly RepositoryCandidate[],
  issuesPerState: number,
): Promise<RepositoryIssueResult[]> => {
  const results: RepositoryIssueResult[] = []
  for (let offset = 0; offset < repositories.length; offset += issueBatchSize) {
    const batch = repositories.slice(offset, offset + issueBatchSize)
    console.log(`Searching issues ${offset + 1}-${offset + batch.length} of ${repositories.length}...`)
    const fields = batch
      .flatMap((repository, index) => {
        const baseQuery = `repo:${repository.nameWithOwner} is:issue in:title,body \"memory leak\"`
        return (['open', 'closed'] as const).map(
          (
            state,
          ) => `${state}${index}: search(query: ${JSON.stringify(`${baseQuery} is:${state}`)}, type: ISSUE, first: ${issuesPerState}) {
            issueCount
            nodes { ... on Issue { ${issueFields} } }
          }`,
        )
      })
      .join('\n')
    const data = await graphql<Record<string, SearchConnection<MemoryLeakIssue>>>(token, `query { ${fields} }`)
    for (let index = 0; index < batch.length; index++) {
      const repository = batch[index]
      const open = data[`open${index}`]
      const closed = data[`closed${index}`]
      if (!repository || !open || !closed) {
        throw new Error('GitHub returned an incomplete issue-search response')
      }
      results.push({
        repository,
        openCount: open.issueCount,
        closedCount: closed.issueCount,
        openIssues: open.nodes.map(summarizeIssue),
        closedIssues: closed.nodes.map(summarizeIssue),
      })
    }
  }
  return sortRepositoryResults(results)
}

const summarizeIssue = (issue: MemoryLeakIssue): MemoryLeakIssue => {
  const bodyText = issue.bodyText.replace(/\s+/g, ' ').trim()
  return {
    ...issue,
    bodyText: bodyText.length > 700 ? `${bodyText.slice(0, 697)}...` : bodyText,
  }
}

export const createMemoryLeakReportData = (
  repositories: readonly RepositoryIssueResult[],
  options: Pick<MemoryLeakReportOptions, 'minStars'>,
  generatedAt = new Date().toISOString(),
): MemoryLeakReportData => {
  return {
    generatedAt,
    searchPhrase: 'memory leak',
    minStars: options.minStars,
    repositoryCount: repositories.length,
    repositoriesWithMatches: repositories.filter((result) => result.openCount + result.closedCount > 0).length,
    openIssueCount: repositories.reduce((total, result) => total + result.openCount, 0),
    closedIssueCount: repositories.reduce((total, result) => total + result.closedCount, 0),
    repositories,
  }
}

export const generateMemoryLeakReport = async (options: MemoryLeakReportOptions): Promise<MemoryLeakReportData> => {
  const token = getGithubToken()
  console.log('Discovering popular JavaScript, TypeScript, and Node.js repositories...')
  const [discovered, seeds] = await Promise.all([
    discoverRepositories(token, options.maxRepositories, options.minStars, options.ignoredRepositories),
    loadSeedRepositories(token, options.seedRepositories),
  ])
  const repositories = selectRepositories(discovered, seeds, options)
  if (repositories.length === 0) {
    throw new Error('No eligible repositories were found')
  }
  console.log(`Scanning ${repositories.length} repositories with a root package.json...`)
  const results = await searchRepositoryIssues(token, repositories, options.issuesPerState)
  const report = createMemoryLeakReportData(results, options)
  await mkdir(dirname(options.outputPath), { recursive: true })
  await writeFile(options.outputPath, renderMemoryLeakReport(report), 'utf8')
  return report
}

const main = async (): Promise<void> => {
  const options = parseMemoryLeakReportArgs(process.argv.slice(2))
  const report = await generateMemoryLeakReport(options)
  console.log(
    `Wrote ${options.outputPath}\n${report.repositoryCount} repositories, ${report.openIssueCount} open and ${report.closedIssueCount} closed matching issues`,
  )
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
