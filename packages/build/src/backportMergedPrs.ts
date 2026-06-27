import { execFile, type ExecFileException } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

export const DEFAULT_UPSTREAM_REPO = 'SimonSiefke/vscode-memory-leak-finder-3'
export const DEFAULT_TARGET_REPO = 'SimonSiefke/vscode-memory-leak-finder'
export const DEFAULT_BASE_BRANCH = 'main'
export const DEFAULT_REMOTE = 'origin'

const root = join(import.meta.dirname, '../../..')
const maxBuffer = 1024 * 1024 * 100

export interface BackportOptions {
  readonly upstreamRepo: string
  readonly targetRepo: string
  readonly baseBranch: string
  readonly remote: string
  readonly cwd: string
  readonly dryRun: boolean
}

export interface MergedPullRequest {
  readonly number: number
  readonly title: string
  readonly mergedAt: string
  readonly url: string
  readonly headRefName: string
  readonly mergeCommit: {
    readonly oid: string
  } | null
}

export interface BackportState {
  readonly backportedPrNumbers: ReadonlySet<number>
  readonly remoteBranches: ReadonlySet<string>
  readonly openPullRequestBranches: ReadonlySet<string>
}

export interface BackportCandidate {
  readonly pullRequest: MergedPullRequest
  readonly branchName: string
}

export type BackportSkipReason = 'already-backported' | 'remote-branch-exists' | 'open-pull-request-exists'

interface CommandResult {
  readonly stdout: string
  readonly stderr: string
  readonly exitCode: number
}

interface CommandOptions {
  readonly cwd: string
  readonly allowFailure?: boolean
}

interface OpenPullRequest {
  readonly headRefName: string
}

export interface MergedTargetPullRequest {
  readonly body: string
  readonly headRefName: string
}

const defaultOptions: BackportOptions = {
  upstreamRepo: DEFAULT_UPSTREAM_REPO,
  targetRepo: DEFAULT_TARGET_REPO,
  baseBranch: DEFAULT_BASE_BRANCH,
  remote: DEFAULT_REMOTE,
  cwd: root,
  dryRun: false,
}

const executeCommand = async (command: string, args: readonly string[], options: CommandOptions): Promise<CommandResult> => {
  return new Promise((resolve, reject) => {
    execFile(command, [...args], { cwd: options.cwd, encoding: 'utf8', maxBuffer }, (error, stdout, stderr) => {
      const exitCode = getExitCode(error)
      const result = {
        stdout,
        stderr,
        exitCode,
      }
      if (error && !options.allowFailure) {
        reject(new Error(formatCommandError(command, args, result)))
        return
      }
      resolve(result)
    })
  })
}

const getExitCode = (error: ExecFileException | null): number => {
  if (!error) {
    return 0
  }
  if (typeof error.code === 'number') {
    return error.code
  }
  return 1
}

const formatCommandError = (command: string, args: readonly string[], result: CommandResult): string => {
  const commandLine = [command, ...args].join(' ')
  const output = [result.stderr.trim(), result.stdout.trim()].filter(Boolean).join('\n')
  if (!output) {
    return `Command failed: ${commandLine}`
  }
  return `Command failed: ${commandLine}\n${output}`
}

const parseOptionValue = (args: readonly string[], index: number, name: string): string => {
  const value = args[index + 1]
  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value for ${name}`)
  }
  return value
}

export const parseArgs = (args: readonly string[]): BackportOptions => {
  const options: BackportOptions = { ...defaultOptions }
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--dry-run') {
      Object.assign(options, { dryRun: true })
    } else if (arg === '--upstream-repo') {
      Object.assign(options, { upstreamRepo: parseOptionValue(args, i, arg) })
      i++
    } else if (arg.startsWith('--upstream-repo=')) {
      Object.assign(options, { upstreamRepo: arg.slice('--upstream-repo='.length) })
    } else if (arg === '--target-repo') {
      Object.assign(options, { targetRepo: parseOptionValue(args, i, arg) })
      i++
    } else if (arg.startsWith('--target-repo=')) {
      Object.assign(options, { targetRepo: arg.slice('--target-repo='.length) })
    } else if (arg === '--base-branch') {
      Object.assign(options, { baseBranch: parseOptionValue(args, i, arg) })
      i++
    } else if (arg.startsWith('--base-branch=')) {
      Object.assign(options, { baseBranch: arg.slice('--base-branch='.length) })
    } else if (arg === '--remote') {
      Object.assign(options, { remote: parseOptionValue(args, i, arg) })
      i++
    } else if (arg.startsWith('--remote=')) {
      Object.assign(options, { remote: arg.slice('--remote='.length) })
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }
  return options
}

export const sortMergedPullRequests = (pullRequests: readonly MergedPullRequest[]): MergedPullRequest[] => {
  return [...pullRequests].sort((a, b) => new Date(a.mergedAt).getTime() - new Date(b.mergedAt).getTime())
}

export const createSlug = (title: string): string => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/g, '')
  return slug || 'pr'
}

export const createBackportBranchName = (pullRequest: Pick<MergedPullRequest, 'number' | 'title'>): string => {
  return `backport/upstream-${pullRequest.number}-${createSlug(pullRequest.title)}`
}

export const createBackportMarker = (upstreamRepo: string, pullRequestNumber: number): string => {
  return `Backport-Upstream-PR: ${upstreamRepo}#${pullRequestNumber}`
}

export const createBackportPullRequestBody = (pullRequest: MergedPullRequest): string => {
  return `Backport of ${pullRequest.url}`
}

export const createBackportCommitBody = (pullRequest: MergedPullRequest, options: Pick<BackportOptions, 'upstreamRepo'>): string => {
  const mergeCommit = pullRequest.mergeCommit?.oid ?? 'unknown'
  return [
    createBackportPullRequestBody(pullRequest),
    '',
    createBackportMarker(options.upstreamRepo, pullRequest.number),
    `Backport-Upstream-URL: ${pullRequest.url}`,
    `Backport-Upstream-Merge-Commit: ${mergeCommit}`,
  ].join('\n')
}

export const createEnableSquashAutoMergeArgs = (
  pullRequestUrl: string,
  options: Pick<BackportOptions, 'targetRepo'>,
): readonly string[] => {
  return ['pr', 'merge', pullRequestUrl, '--repo', options.targetRepo, '--auto', '--squash']
}

export const parseBackportedPrNumbers = (gitLog: string, upstreamRepo: string): Set<number> => {
  const escapedRepo = escapeRegExp(upstreamRepo)
  const markerPattern = new RegExp(`Backport-Upstream-PR: ${escapedRepo}#(\\d+)`, 'g')
  const numbers = new Set<number>()
  for (const match of gitLog.matchAll(markerPattern)) {
    numbers.add(Number(match[1]))
  }
  return numbers
}

export const parseBackportedPrNumberFromBranchName = (branchName: string): number | undefined => {
  const match = /^backport\/upstream-(\d+)-/.exec(branchName)
  if (!match) {
    return undefined
  }
  return Number(match[1])
}

export const parseMergedTargetBackportedPrNumbers = (
  pullRequests: readonly MergedTargetPullRequest[],
  upstreamRepo: string,
): Set<number> => {
  const numbers = new Set<number>()
  for (const pullRequest of pullRequests) {
    for (const number of parseBackportedPrNumbers(pullRequest.body, upstreamRepo)) {
      numbers.add(number)
    }
    const branchNumber = parseBackportedPrNumberFromBranchName(pullRequest.headRefName)
    if (branchNumber) {
      numbers.add(branchNumber)
    }
  }
  return numbers
}

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const getBackportSkipReason = (
  candidate: BackportCandidate,
  state: BackportState,
  upstreamRepo: string,
): BackportSkipReason | undefined => {
  if (state.backportedPrNumbers.has(candidate.pullRequest.number)) {
    return 'already-backported'
  }
  if (state.remoteBranches.has(candidate.branchName)) {
    return 'remote-branch-exists'
  }
  if (state.openPullRequestBranches.has(candidate.branchName)) {
    return 'open-pull-request-exists'
  }
  void upstreamRepo
  return undefined
}

export const selectNextBackportPullRequest = (
  pullRequests: readonly MergedPullRequest[],
  state: BackportState,
  upstreamRepo: string,
): BackportCandidate | undefined => {
  for (const pullRequest of sortMergedPullRequests(pullRequests)) {
    const candidate = {
      pullRequest,
      branchName: createBackportBranchName(pullRequest),
    }
    if (!getBackportSkipReason(candidate, state, upstreamRepo)) {
      return candidate
    }
  }
  return undefined
}

const getMergedPullRequests = async (options: BackportOptions): Promise<MergedPullRequest[]> => {
  const result = await executeCommand(
    'gh',
    [
      'pr',
      'list',
      '--repo',
      options.upstreamRepo,
      '--state',
      'merged',
      '--base',
      options.baseBranch,
      '--limit',
      '1000',
      '--json',
      'number,title,mergedAt,url,mergeCommit,headRefName',
    ],
    { cwd: options.cwd },
  )
  return sortMergedPullRequests(JSON.parse(result.stdout) as MergedPullRequest[])
}

const getRemoteBranches = async (options: BackportOptions): Promise<Set<string>> => {
  const result = await executeCommand('git', ['ls-remote', '--heads', options.remote], { cwd: options.cwd })
  const branches = result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split('\t')[1])
    .filter((ref): ref is string => Boolean(ref))
    .map((ref) => ref.replace('refs/heads/', ''))
  return new Set(branches)
}

const getOpenPullRequestBranches = async (options: BackportOptions): Promise<Set<string>> => {
  const result = await executeCommand(
    'gh',
    [
      'pr',
      'list',
      '--repo',
      options.targetRepo,
      '--state',
      'open',
      '--base',
      options.baseBranch,
      '--limit',
      '1000',
      '--json',
      'headRefName',
    ],
    { cwd: options.cwd },
  )
  const pullRequests = JSON.parse(result.stdout) as OpenPullRequest[]
  return new Set(pullRequests.map((pullRequest) => pullRequest.headRefName))
}

const getGitLogBackportedPrNumbers = async (options: BackportOptions): Promise<Set<number>> => {
  const result = await executeCommand('git', ['log', `${options.remote}/${options.baseBranch}`, '--format=%B'], { cwd: options.cwd })
  return parseBackportedPrNumbers(result.stdout, options.upstreamRepo)
}

const getMergedTargetBackportedPrNumbers = async (options: BackportOptions): Promise<Set<number>> => {
  const result = await executeCommand(
    'gh',
    [
      'pr',
      'list',
      '--repo',
      options.targetRepo,
      '--state',
      'merged',
      '--base',
      options.baseBranch,
      '--limit',
      '1000',
      '--json',
      'body,headRefName',
    ],
    { cwd: options.cwd },
  )
  const pullRequests = JSON.parse(result.stdout) as MergedTargetPullRequest[]
  return parseMergedTargetBackportedPrNumbers(pullRequests, options.upstreamRepo)
}

const getBackportedPrNumbers = async (options: BackportOptions): Promise<Set<number>> => {
  const [gitLogBackportedPrNumbers, mergedTargetBackportedPrNumbers] = await Promise.all([
    getGitLogBackportedPrNumbers(options),
    getMergedTargetBackportedPrNumbers(options),
  ])
  return new Set([...gitLogBackportedPrNumbers, ...mergedTargetBackportedPrNumbers])
}

const cleanupLocalBackportBranch = async (candidate: BackportCandidate, options: BackportOptions): Promise<void> => {
  await executeCommand('git', ['worktree', 'prune'], { cwd: options.cwd })
  const localBranch = await executeCommand('git', ['branch', '--list', candidate.branchName], { cwd: options.cwd })
  if (localBranch.stdout.trim()) {
    await executeCommand('git', ['branch', '--delete', '--force', candidate.branchName], { cwd: options.cwd })
  }
}

const getBackportState = async (options: BackportOptions): Promise<BackportState> => {
  const [backportedPrNumbers, remoteBranches, openPullRequestBranches] = await Promise.all([
    getBackportedPrNumbers(options),
    getRemoteBranches(options),
    getOpenPullRequestBranches(options),
  ])
  return {
    backportedPrNumbers,
    remoteBranches,
    openPullRequestBranches,
  }
}

const printDryRun = (candidate: BackportCandidate, options: BackportOptions): void => {
  console.log(`Would backport ${options.upstreamRepo}#${candidate.pullRequest.number}: ${candidate.pullRequest.title}`)
  console.log(`Would create branch: ${candidate.branchName}`)
  console.log(`Would apply patch from: ${candidate.pullRequest.url}`)
  console.log(`Would push to: ${options.remote}`)
  console.log(`Would open PR in: ${options.targetRepo}`)
  console.log('Would enable squash auto-merge')
}

interface CreatedBackportPullRequest {
  readonly status: 'created'
  readonly url: string
}

interface NoChangesBackportPullRequest {
  readonly status: 'no-changes'
}

type BackportPullRequestResult = CreatedBackportPullRequest | NoChangesBackportPullRequest

const createBackportPullRequest = async (candidate: BackportCandidate, options: BackportOptions): Promise<BackportPullRequestResult> => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'vscode-memory-leak-finder-backport-'))
  const worktreePath = join(tempRoot, 'worktree')
  const patchPath = join(tempRoot, `upstream-${candidate.pullRequest.number}.patch`)
  let keepWorktree = false
  let branchCreated = false

  try {
    await cleanupLocalBackportBranch(candidate, options)
    await executeCommand('git', ['worktree', 'add', '--detach', worktreePath, `${options.remote}/${options.baseBranch}`], {
      cwd: options.cwd,
    })
    await executeCommand('git', ['switch', '-c', candidate.branchName], { cwd: worktreePath })
    branchCreated = true

    const patch = await executeCommand(
      'gh',
      ['pr', 'diff', String(candidate.pullRequest.number), '--repo', options.upstreamRepo, '--patch'],
      {
        cwd: worktreePath,
      },
    )
    await writeFile(patchPath, patch.stdout)

    const applyResult = await executeCommand('git', ['apply', '--3way', '--index', patchPath], {
      cwd: worktreePath,
      allowFailure: true,
    })
    if (applyResult.exitCode !== 0) {
      keepWorktree = true
      throw new Error(
        [
          `Failed to apply upstream PR ${options.upstreamRepo}#${candidate.pullRequest.number}.`,
          `Worktree left for conflict resolution: ${worktreePath}`,
          applyResult.stderr.trim(),
          applyResult.stdout.trim(),
        ]
          .filter(Boolean)
          .join('\n'),
      )
    }

    const diffResult = await executeCommand('git', ['diff', '--cached', '--quiet'], {
      cwd: worktreePath,
      allowFailure: true,
    })
    if (diffResult.exitCode === 0) {
      return { status: 'no-changes' }
    }
    if (diffResult.exitCode !== 1) {
      throw new Error(`Failed to inspect staged backport changes in ${worktreePath}`)
    }

    const commitBody = createBackportCommitBody(candidate.pullRequest, options)
    const pullRequestBody = createBackportPullRequestBody(candidate.pullRequest)
    await executeCommand('git', ['commit', '-m', candidate.pullRequest.title, '-m', commitBody], { cwd: worktreePath })
    await executeCommand('git', ['push', '--set-upstream', options.remote, candidate.branchName], { cwd: worktreePath })
    const pr = await executeCommand(
      'gh',
      [
        'pr',
        'create',
        '--repo',
        options.targetRepo,
        '--base',
        options.baseBranch,
        '--head',
        candidate.branchName,
        '--title',
        candidate.pullRequest.title,
        '--body',
        pullRequestBody,
      ],
      { cwd: worktreePath },
    )
    const pullRequestUrl = pr.stdout.trim()
    await executeCommand('gh', createEnableSquashAutoMergeArgs(pullRequestUrl, options), { cwd: worktreePath })

    return {
      status: 'created',
      url: pullRequestUrl,
    }
  } finally {
    if (!keepWorktree) {
      await executeCommand('git', ['worktree', 'remove', '--force', worktreePath], {
        cwd: options.cwd,
        allowFailure: true,
      })
      if (branchCreated) {
        await executeCommand('git', ['branch', '--delete', '--force', candidate.branchName], {
          cwd: options.cwd,
          allowFailure: true,
        })
      }
      await rm(tempRoot, { recursive: true, force: true })
    }
  }
}

export const runBackportMergedPrs = async (options: BackportOptions): Promise<void> => {
  await executeCommand('git', ['fetch', options.remote, options.baseBranch], { cwd: options.cwd })

  const pullRequests = await getMergedPullRequests(options)
  const state = await getBackportState(options)
  const noChangePullRequestNumbers = new Set<number>()

  while (true) {
    const remainingPullRequests = pullRequests.filter((pullRequest) => !noChangePullRequestNumbers.has(pullRequest.number))
    const candidate = selectNextBackportPullRequest(remainingPullRequests, state, options.upstreamRepo)
    if (!candidate) {
      console.log('No upstream PRs to backport.')
      return
    }

    if (options.dryRun) {
      printDryRun(candidate, options)
      return
    }

    const result = await createBackportPullRequest(candidate, options)
    if (result.status === 'no-changes') {
      noChangePullRequestNumbers.add(candidate.pullRequest.number)
      console.log(`Skipping ${options.upstreamRepo}#${candidate.pullRequest.number}: patch produced no changes.`)
      continue
    }

    console.log(`Created backport PR: ${result.url}`)
    return
  }
}

const main = async (): Promise<void> => {
  try {
    await runBackportMergedPrs(parseArgs(process.argv.slice(2)))
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
