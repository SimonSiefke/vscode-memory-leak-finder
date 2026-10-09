import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { renderMemoryLeakReport } from './memoryLeakReportHtml.ts'

export const DEFAULT_MIN_STARS = 5_000
export const DEFAULT_MAX_REPOSITORIES = 600
export const DEFAULT_ISSUES_PER_STATE = 20
export const DEFAULT_REQUEST_DELAY_MS = 750
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
  'n8n',
  'developer-roadmap',
  'dify',
  'clash-verge-rev',
  'uptime-kuma',
  'lobehub',
  'github-readme-stats',
  'codeserver',
  'worldmonitor',
  'nestjs',
  'json-server',
  'angular/angular',
  'angular/components',
  'tensorflow/tfjs',
  'emberjs/ember.js',
  'apollographql/apollo-client',
  'ionic-team/ionic-framework',
  'eclipse-theia/theia',
  'rocketchat/rocket.chat',
  'storybookjs/storybook',
  'ant-design/ant-design',
  'meteor/meteor',
  'balderdashy/sails',
  'gatsbyjs/gatsby',
  'discordjs/discord.js',
  'strapi/strapi',
  'zen-browser/desktop',
  'vuetifyjs/vuetify',
  'webtorrent/webtorrent',
  'kilo-org/kilocode',
  'jquery/jquery',
  'petkaantonov/bluebird',
  'ant-design/ant-design-pro',
  'ruvnet/ruflo',
  'webpack/webpack',
  'mui/material-ui',
  'typeorm/typeorm',
  'mastra-ai/mastra',
  'node-red/node-red',
  'mozilla/pdf.js',
  'jashkenas/backbone',
  'angular/angular-cli',
  'mochajs/mocha',
  'element-plus/element-plus',
  'tryghost/ghost',
  'wwebjs/whatsapp-web.js',
  'mswjs/msw',
  'code-yeongyu/oh-my-openagent',
  'quasarframework/quasar',
  'jaredpalmer/formik',
  'darkreader/darkreader',
  'cherryhq/cherry-studio',
  'directus/directus',
  'parse-community/parse-server',
  'jitsi/jitsi-meet',
  'payloadcms/payload',
  'lit/lit',
  'lodash/lodash',
  'danny-avila/librechat',
  'knex/knex',
  'flowiseai/flowise',
] as const

const root = join(import.meta.dirname, '../../..')
const defaultOutputPath = join(root, '.memory-leak-report/index.html')
const githubGraphqlUrl = 'https://api.github.com/graphql'
const issueBatchSize = 5
const repositoryBatchSize = 25
const retryableStatusCodes = new Set([502, 503, 504])
const githubRateLimitReserve = 100
const githubSearchResultLimit = 1_000

export interface MemoryLeakReportOptions {
  readonly minStars: number
  readonly maxRepositories: number
  readonly issuesPerState: number
  readonly outputPath: string
  readonly seedRepositories: readonly string[]
  readonly ignoredRepositories: readonly string[]
  readonly requestDelayMs: number
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

interface GithubClient {
  readonly token: string
  readonly requestDelayMs: number
  nextRequestAt: number
  rateLimitRemaining: number | undefined
  rateLimitResetAt: number | undefined
}

interface PageInfo {
  readonly endCursor: string | null
  readonly hasNextPage: boolean
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
  let requestDelayMs = DEFAULT_REQUEST_DELAY_MS
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
    } else if (arg === '--request-delay-ms') {
      requestDelayMs = parsePositiveInteger(parseOptionValue(args, index, arg), arg, true)
      index++
    } else if (arg.startsWith('--request-delay-ms=')) {
      requestDelayMs = parsePositiveInteger(arg.slice('--request-delay-ms='.length), '--request-delay-ms', true)
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
    requestDelayMs,
  }
}

const printHelp = (): void => {
  console.log(`Generate an HTML overview of memory-leak issues in popular Node.js repositories.

Usage: npm run memory-leak-report -- [options]

Options:
  --min-stars <number>        Minimum stars for discovered repositories (default: ${DEFAULT_MIN_STARS})
  --max-repos <number>        Maximum repositories to scan, including seeds (default: ${DEFAULT_MAX_REPOSITORIES})
  --issues-per-state <number> Issue cards retained per open/closed column (default: ${DEFAULT_ISSUES_PER_STATE})
  --request-delay-ms <number> Minimum delay between GitHub requests (default: ${DEFAULT_REQUEST_DELAY_MS})
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

const delay = async (milliseconds: number): Promise<void> => {
  await new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds))
}

const waitForGithubAvailability = async (client: GithubClient): Promise<void> => {
  if (client.rateLimitRemaining !== undefined && client.rateLimitRemaining < githubRateLimitReserve) {
    const waitMilliseconds = Math.max(1_000, (client.rateLimitResetAt || Date.now() + 60_000) - Date.now() + 1_000)
    console.log(
      `GitHub rate limit has ${client.rateLimitRemaining} points left; waiting ${Math.ceil(waitMilliseconds / 1_000)}s for reset...`,
    )
    await delay(waitMilliseconds)
    client.rateLimitRemaining = undefined
    client.rateLimitResetAt = undefined
  }
  const pacingDelay = client.nextRequestAt - Date.now()
  if (pacingDelay > 0) {
    await delay(pacingDelay)
  }
}

const updateRateLimit = (client: GithubClient, response: Response): void => {
  const remainingHeader = response.headers.get('x-ratelimit-remaining')
  const resetHeader = response.headers.get('x-ratelimit-reset')
  if (remainingHeader !== null) {
    const remaining = Number(remainingHeader)
    if (Number.isFinite(remaining)) {
      client.rateLimitRemaining = remaining
    }
  }
  if (resetHeader !== null) {
    const reset = Number(resetHeader)
    if (Number.isFinite(reset) && reset > 0) {
      client.rateLimitResetAt = reset * 1_000
    }
  }
  client.nextRequestAt = Date.now() + client.requestDelayMs
}

const getRetryDelay = (response: Response, attempt: number): number | undefined => {
  const retryAfter = Number(response.headers.get('retry-after'))
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return retryAfter * 1_000
  }
  if (response.status === 403 || response.status === 429) {
    const remaining = response.headers.get('x-ratelimit-remaining')
    const reset = Number(response.headers.get('x-ratelimit-reset'))
    if (remaining === '0' && Number.isFinite(reset) && reset > 0) {
      return Math.max(1_000, reset * 1_000 - Date.now() + 1_000)
    }
    return 60_000 * (attempt + 1)
  }
  if (retryableStatusCodes.has(response.status)) {
    return 500 * 2 ** attempt
  }
  return undefined
}

const graphql = async <T>(client: GithubClient, query: string): Promise<T> => {
  let response: Response | undefined
  for (let attempt = 0; attempt < 5; attempt++) {
    await waitForGithubAvailability(client)
    response = await fetch(githubGraphqlUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${client.token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'vscode-memory-leak-finder',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ query }),
    })
    updateRateLimit(client, response)
    if (response.ok) {
      break
    }
    const retryDelay = getRetryDelay(response, attempt)
    if (retryDelay === undefined || attempt === 4) {
      break
    }
    console.log(`GitHub returned ${response.status}; retrying in ${Math.ceil(retryDelay / 1_000)}s...`)
    await delay(retryDelay)
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
  client: GithubClient,
  maxRepositories: number,
  minStars: number,
  ignoredRepositories: readonly string[],
): Promise<RepositoryCandidate[]> => {
  const candidatesPerPage = 100
  const candidateTarget = Math.min(githubSearchResultLimit * 3, Math.max(maxRepositories * 2, 100))
  const searches = [
    `language:JavaScript stars:>=${minStars} fork:false archived:false sort:stars-desc`,
    `language:TypeScript stars:>=${minStars} fork:false archived:false sort:stars-desc`,
    `topic:nodejs stars:>=${minStars} fork:false archived:false sort:stars-desc`,
  ]
  const uniqueRepositories = new Map<string, RepositorySummary>()
  const searchStates = searches.map((search) => ({ search, cursor: undefined as string | undefined, hasNextPage: true }))
  for (let page = 0; page < githubSearchResultLimit / candidatesPerPage && uniqueRepositories.size < candidateTarget; page++) {
    for (const state of searchStates) {
      if (!state.hasNextPage) {
        continue
      }
      const after = state.cursor ? `, after: ${JSON.stringify(state.cursor)}` : ''
      const data = await graphql<{
        readonly search: { readonly nodes: readonly RepositorySummary[]; readonly pageInfo: PageInfo }
      }>(
        client,
        `query { search(query: ${JSON.stringify(state.search)}, type: REPOSITORY, first: ${candidatesPerPage}${after}) {
          nodes { ... on Repository { ${repositorySummaryFields} } }
          pageInfo { endCursor hasNextPage }
        } }`,
      )
      for (const repository of data.search.nodes) {
        if (!isRepositoryIgnored(repository.nameWithOwner, ignoredRepositories)) {
          uniqueRepositories.set(repository.nameWithOwner.toLowerCase(), repository)
        }
      }
      state.cursor = data.search.pageInfo.endCursor || undefined
      state.hasNextPage = data.search.pageInfo.hasNextPage
    }
    console.log(`Discovered ${uniqueRepositories.size} candidate repositories...`)
  }
  const metadataCandidateCount = Math.min(uniqueRepositories.size, candidateTarget)
  const names = [...uniqueRepositories.values()]
    .sort((a, b) => b.stargazerCount - a.stargazerCount)
    .slice(0, metadataCandidateCount)
    .map((repository) => repository.nameWithOwner)
  return loadRepositories(client, names)
}

const loadRepositories = async (client: GithubClient, repositories: readonly string[]): Promise<RepositoryCandidate[]> => {
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
    const data = await graphql<Record<string, RepositoryCandidate | null>>(client, `query { ${fields} }`)
    results.push(...Object.values(data).filter((repository): repository is RepositoryCandidate => Boolean(repository)))
  }
  return results
}

const loadSeedRepositories = async (client: GithubClient, repositories: readonly string[]): Promise<RepositoryCandidate[]> => {
  const results = await loadRepositories(client, repositories)
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
  client: GithubClient,
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
    const data = await graphql<Record<string, SearchConnection<MemoryLeakIssue>>>(client, `query { ${fields} }`)
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
  const client: GithubClient = {
    token,
    requestDelayMs: options.requestDelayMs,
    nextRequestAt: 0,
    rateLimitRemaining: undefined,
    rateLimitResetAt: undefined,
  }
  console.log('Discovering popular JavaScript, TypeScript, and Node.js repositories...')
  const seeds = await loadSeedRepositories(client, options.seedRepositories)
  const discovered = await discoverRepositories(client, options.maxRepositories, options.minStars, options.ignoredRepositories)
  const repositories = selectRepositories(discovered, seeds, options)
  if (repositories.length === 0) {
    throw new Error('No eligible repositories were found')
  }
  console.log(`Scanning ${repositories.length} repositories with a root package.json...`)
  const results = await searchRepositoryIssues(client, repositories, options.issuesPerState)
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
