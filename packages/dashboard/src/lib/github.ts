import { Octokit } from '@octokit/rest'

export type RepoKey = 'fork' | 'upstream'

export type ReviewState = 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING'

export type DashboardStatus = 'draft' | 'changes-requested' | 'review-ready' | 'in-review' | 'merged' | 'closed'

export interface GitHubLabel {
  color: string
  name: string
}

interface SearchIssue {
  body: string | null
  closed_at: string | null
  comments: number
  created_at: string
  html_url: string
  labels: GitHubLabel[]
  number: number
  pull_request: {
    html_url: string
    merged_at: string | null
  }
  state: 'open' | 'closed'
  title: string
  updated_at: string
  user: {
    login: string
    avatar_url: string
  }
}

interface PullRequestDetails {
  additions?: number
  base: {
    ref: string
    repo: {
      full_name: string
    }
  }
  body: string | null
  changed_files?: number
  commits?: number
  deletions?: number
  draft: boolean
  head: {
    ref: string
    repo: {
      full_name: string
    } | null
  }
  html_url: string
  mergeable_state?: string | null
  merged_at: string | null
  number: number
  requested_reviewers: Array<{ login: string }>
  requested_teams: Array<{ name: string }>
  state: 'open' | 'closed'
  title: string
  updated_at: string
  user: {
    login: string
    avatar_url: string
  }
}

export interface Review {
  body: string | null
  id: number
  state: ReviewState
  submitted_at: string | null
  user: {
    login: string
    avatar_url: string
  } | null
}

export interface DashboardPullRequest {
  additions: number | null
  author: string
  authorAvatarUrl: string
  baseRef: string
  body: string
  changedFiles: number | null
  closedAt: string | null
  comments: number
  commits: number | null
  createdAt: string
  deletions: number | null
  draft: boolean
  headRef: string
  id: string
  labels: GitHubLabel[]
  mergeableState: string | null
  mergedAt: string | null
  number: number
  repoFullName: string
  repoKey: RepoKey
  requestedReviewers: string[]
  reviews: Review[]
  state: 'open' | 'closed'
  status: DashboardStatus
  statusLabel: string
  title: string
  updatedAt: string
  url: string
}

export interface DashboardData {
  fetchedAt: string
  pullRequests: DashboardPullRequest[]
  rateLimitRemaining: string | null
}

export const dashboardCacheKey = 'vscode-leak-dashboard.github-data'
const pullRequestDetailCachePrefix = 'vscode-leak-dashboard.pr-detail:'

export interface DiffLine {
  content: string
  kind: 'context' | 'add' | 'remove' | 'meta'
  newLineNumber: number | null
  oldLineNumber: number | null
}

export interface DiffFile {
  additions: number
  deletions: number
  lines: DiffLine[]
  path: string
}

export interface PullRequestImage {
  alt: string
  createdAt: string
  source: string
  url: string
}

export interface PullRequestComment {
  author: string
  authorAvatarUrl: string
  body: string
  createdAt: string
  id: number
  updatedAt: string
  url: string
}

export interface PullRequestInspection {
  afterImage: PullRequestImage | null
  beforeImage: PullRequestImage | null
  comments: PullRequestComment[]
  description: string
  diffFiles: DiffFile[]
  fetchedAt: string
  prId: string
  updatedAt: string
}

const endpoints = [
  {
    owner: 'SimonSiefke',
    query: 'repo:SimonSiefke/vscode is:pr is:open',
    repo: 'vscode',
    repoFullName: 'SimonSiefke/vscode',
    repoKey: 'fork' as const,
  },
  {
    owner: 'microsoft',
    query: 'repo:microsoft/vscode is:pr author:SimonSiefke',
    repo: 'vscode',
    repoFullName: 'microsoft/vscode',
    repoKey: 'upstream' as const,
  },
]

const createOctokit = (token: string): Octokit => {
  return new Octokit({
    auth: token || undefined,
  })
}

const fetchAllSearchItems = async (octokit: Octokit, query: string): Promise<{ data: SearchIssue[]; remaining: string | null }> => {
  const items: SearchIssue[] = []
  let remaining: string | null = null

  for await (const response of octokit.paginate.iterator(octokit.rest.search.issuesAndPullRequests, {
    order: 'desc',
    per_page: 100,
    q: query,
    sort: 'updated',
  })) {
    remaining = response.headers['x-ratelimit-remaining'] ?? remaining
    items.push(...(response.data as SearchIssue[]))
    if (response.data.length < 100) {
      break
    }
  }

  return { data: items, remaining }
}

const fetchOpenPullRequestDetails = async (
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<{ data: PullRequestDetails[]; remaining: string | null }> => {
  const data: PullRequestDetails[] = []
  let remaining: string | null = null

  for await (const response of octokit.paginate.iterator(octokit.rest.pulls.list, {
    direction: 'desc',
    owner,
    per_page: 100,
    repo,
    sort: 'updated',
    state: 'open',
  })) {
    remaining = response.headers['x-ratelimit-remaining'] ?? remaining
    data.push(...(response.data as PullRequestDetails[]))
    if (response.data.length < 100) {
      break
    }
  }

  return { data, remaining }
}

export const isGitHubRateLimitError = (error: unknown): boolean => {
  return error instanceof Error && /rate limit/i.test(error.message)
}

const getDashboardStatus = (
  issue: SearchIssue,
  pullRequest: PullRequestDetails | undefined,
): { status: DashboardStatus; label: string } => {
  if (issue.pull_request.merged_at) {
    return { label: 'Merged', status: 'merged' }
  }
  if (issue.state === 'closed') {
    return { label: 'Closed', status: 'closed' }
  }
  if (pullRequest?.draft) {
    return { label: 'Draft', status: 'draft' }
  }
  if ((pullRequest?.requested_reviewers.length ?? 0) > 0 || (pullRequest?.requested_teams.length ?? 0) > 0) {
    return { label: 'In review', status: 'in-review' }
  }

  return { label: 'Ready', status: 'review-ready' }
}

const toDashboardPullRequest = (
  issue: SearchIssue,
  pullRequest: PullRequestDetails | undefined,
  repoKey: RepoKey,
  repoFullName: string,
): DashboardPullRequest => {
  const { label, status } = getDashboardStatus(issue, pullRequest)
  return {
    additions: pullRequest?.additions ?? null,
    author: pullRequest?.user.login ?? issue.user.login,
    authorAvatarUrl: pullRequest?.user.avatar_url ?? issue.user.avatar_url,
    baseRef: pullRequest ? `${pullRequest.base.repo.full_name}:${pullRequest.base.ref}` : repoFullName,
    body: pullRequest?.body ?? issue.body ?? '',
    changedFiles: pullRequest?.changed_files ?? null,
    closedAt: issue.closed_at,
    comments: issue.comments,
    commits: pullRequest?.commits ?? null,
    createdAt: issue.created_at,
    deletions: pullRequest?.deletions ?? null,
    draft: pullRequest?.draft ?? false,
    headRef: pullRequest ? `${pullRequest.head.repo?.full_name ?? 'unknown'}:${pullRequest.head.ref}` : 'Open on GitHub for branch details',
    id: `${repoFullName}#${issue.number}`,
    labels: issue.labels,
    mergeableState: pullRequest?.mergeable_state ?? null,
    mergedAt: issue.pull_request.merged_at ?? pullRequest?.merged_at ?? null,
    number: issue.number,
    repoFullName,
    repoKey,
    requestedReviewers: pullRequest
      ? [...pullRequest.requested_reviewers.map((reviewer) => reviewer.login), ...pullRequest.requested_teams.map((team) => team.name)]
      : [],
    reviews: [],
    state: issue.state,
    status,
    statusLabel: label,
    title: pullRequest?.title ?? issue.title,
    updatedAt: pullRequest?.updated_at ?? issue.updated_at,
    url: pullRequest?.html_url ?? issue.pull_request.html_url ?? issue.html_url,
  }
}

export const fetchDashboardData = async (token: string): Promise<DashboardData> => {
  const octokit = createOctokit(token.trim())
  const pullRequests: DashboardPullRequest[] = []
  let rateLimitRemaining: string | null = null

  for (const endpoint of endpoints) {
    const searchResult = await fetchAllSearchItems(octokit, endpoint.query)
    rateLimitRemaining = searchResult.remaining ?? rateLimitRemaining
    const searchItems = searchResult.data
    const openIssues = searchItems.filter((issue) => issue.state === 'open')
    const detailsByNumber = new Map<number, PullRequestDetails>()

    if (endpoint.repoKey === 'fork') {
      const details = await fetchOpenPullRequestDetails(octokit, endpoint.owner, endpoint.repo)
      rateLimitRemaining = details.remaining ?? rateLimitRemaining
      for (const detail of details.data) {
        detailsByNumber.set(detail.number, detail)
      }
    } else if (token.trim()) {
      const openDetails = await Promise.all(
        openIssues.map(async (issue) => {
          const result = await octokit.rest.pulls.get({
            owner: endpoint.owner,
            pull_number: issue.number,
            repo: endpoint.repo,
          })
          rateLimitRemaining = result.headers['x-ratelimit-remaining'] ?? rateLimitRemaining
          return result.data as PullRequestDetails
        }),
      )
      for (const detail of openDetails) {
        detailsByNumber.set(detail.number, detail)
      }
    }

    pullRequests.push(
      ...searchItems.map((issue) =>
        toDashboardPullRequest(issue, detailsByNumber.get(issue.number), endpoint.repoKey, endpoint.repoFullName),
      ),
    )
  }

  pullRequests.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  return {
    fetchedAt: new Date().toISOString(),
    pullRequests,
    rateLimitRemaining,
  }
}

export const readCachedDashboardData = (): DashboardData | null => {
  try {
    const raw = localStorage.getItem(dashboardCacheKey)
    return raw ? (JSON.parse(raw) as DashboardData) : null
  } catch {
    return null
  }
}

export const writeCachedDashboardData = (data: DashboardData): void => {
  localStorage.setItem(dashboardCacheKey, JSON.stringify(data))
}

export const readCachedPullRequestInspection = (pullRequest: DashboardPullRequest): PullRequestInspection | null => {
  try {
    const raw = localStorage.getItem(getPullRequestDetailCacheKey(pullRequest))
    const cached = raw ? (JSON.parse(raw) as PullRequestInspection) : null
    if (!cached || cached.updatedAt !== pullRequest.updatedAt) {
      return null
    }
    return normalizePullRequestInspection(cached)
  } catch {
    return null
  }
}

export const writeCachedPullRequestInspection = (pullRequest: DashboardPullRequest, inspection: PullRequestInspection): void => {
  localStorage.setItem(getPullRequestDetailCacheKey(pullRequest), JSON.stringify(inspection))
}

export const fetchPullRequestInspection = async (token: string, pullRequest: DashboardPullRequest): Promise<PullRequestInspection> => {
  const octokit = createOctokit(token.trim())
  const [owner, repo] = pullRequest.repoFullName.split('/')
  const [diffResponse, comments] = await Promise.all([
    octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
      mediaType: {
        format: 'diff',
      },
      owner,
      pull_number: pullRequest.number,
      repo,
    }),
    octokit.paginate(octokit.rest.issues.listComments, {
      issue_number: pullRequest.number,
      owner,
      per_page: 100,
      repo,
    }),
  ])

  const imageSources = [
    {
      body: pullRequest.body,
      createdAt: pullRequest.updatedAt,
      source: 'PR description',
    },
    ...comments
      .filter((comment) => comment.user?.login.toLowerCase().includes('memory-leak-finder-bot'))
      .map((comment) => ({
        body: comment.body ?? '',
        createdAt: comment.updated_at ?? comment.created_at,
        source: comment.user?.login ?? 'memory-leak-finder-bot',
      })),
  ]

  const images = imageSources.flatMap((source) => extractImages(source.body, source.source, source.createdAt))
  const { afterImage, beforeImage } = pickBeforeAfterImages(images)
  const renderedComments = comments.map((comment) => ({
    author: comment.user?.login ?? 'unknown',
    authorAvatarUrl: comment.user?.avatar_url ?? '',
    body: comment.body ?? '',
    createdAt: comment.created_at,
    id: comment.id,
    updatedAt: comment.updated_at ?? comment.created_at,
    url: comment.html_url,
  }))

  return {
    afterImage,
    beforeImage,
    comments: renderedComments,
    description: pullRequest.body,
    diffFiles: parseUnifiedDiff(String(diffResponse.data)),
    fetchedAt: new Date().toISOString(),
    prId: pullRequest.id,
    updatedAt: pullRequest.updatedAt,
  }
}

const getPullRequestDetailCacheKey = (pullRequest: DashboardPullRequest): string => {
  return `${pullRequestDetailCachePrefix}${pullRequest.id}`
}

const normalizePullRequestInspection = (inspection: PullRequestInspection): PullRequestInspection => {
  return {
    ...inspection,
    afterImage: inspection.afterImage ?? null,
    beforeImage: inspection.beforeImage ?? null,
    comments: Array.isArray(inspection.comments) ? inspection.comments : [],
    description: inspection.description ?? '',
    diffFiles: Array.isArray(inspection.diffFiles) ? inspection.diffFiles : [],
  }
}

const parseUnifiedDiff = (diff: string): DiffFile[] => {
  const files: DiffFile[] = []
  let currentFile: DiffFile | null = null
  let oldLine = 0
  let newLine = 0

  for (const line of diff.split('\n')) {
    if (line.startsWith('diff --git ')) {
      if (currentFile) {
        files.push(currentFile)
      }
      currentFile = {
        additions: 0,
        deletions: 0,
        lines: [],
        path: '',
      }
      continue
    }

    if (!currentFile) {
      continue
    }

    if (line.startsWith('+++ b/')) {
      currentFile.path = line.slice('+++ b/'.length)
      continue
    }

    if (line.startsWith('@@')) {
      const match = /@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line)
      oldLine = match ? Number(match[1]) : oldLine
      newLine = match ? Number(match[2]) : newLine
      currentFile.lines.push({ content: line, kind: 'meta', newLineNumber: null, oldLineNumber: null })
      continue
    }

    if (
      !currentFile.path ||
      line.startsWith('--- ') ||
      line.startsWith('index ') ||
      line.startsWith('new file ') ||
      line.startsWith('deleted file ')
    ) {
      continue
    }

    if (line.startsWith('+')) {
      currentFile.additions++
      currentFile.lines.push({ content: line.slice(1), kind: 'add', newLineNumber: newLine, oldLineNumber: null })
      newLine++
      continue
    }

    if (line.startsWith('-')) {
      currentFile.deletions++
      currentFile.lines.push({ content: line.slice(1), kind: 'remove', newLineNumber: null, oldLineNumber: oldLine })
      oldLine++
      continue
    }

    currentFile.lines.push({
      content: line.startsWith(' ') ? line.slice(1) : line,
      kind: 'context',
      newLineNumber: newLine,
      oldLineNumber: oldLine,
    })
    oldLine++
    newLine++
  }

  if (currentFile) {
    files.push(currentFile)
  }

  return files.filter((file) => file.path)
}

const extractImages = (body: string, source: string, createdAt: string): PullRequestImage[] => {
  const images: PullRequestImage[] = []
  const markdownImageRegex = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
  const htmlImageRegex = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/g
  let match: RegExpExecArray | null

  while ((match = markdownImageRegex.exec(body))) {
    images.push({ alt: `${match[1]} ${getNearbyText(body, match.index)}`.trim(), createdAt, source, url: match[2] })
  }

  while ((match = htmlImageRegex.exec(body))) {
    images.push({ alt: getNearbyText(body, match.index), createdAt, source, url: match[1] })
  }

  return images
}

const getNearbyText = (body: string, index: number): string => {
  return body.slice(Math.max(0, index - 160), Math.min(body.length, index + 160))
}

const pickBeforeAfterImages = (
  images: PullRequestImage[],
): { beforeImage: PullRequestImage | null; afterImage: PullRequestImage | null } => {
  const sorted = images.slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  const newestFirst = sorted.slice().reverse()
  const beforeImage = newestFirst.find((image) => /before/i.test(`${image.alt} ${image.url}`)) ?? sorted.at(-2) ?? null
  const afterImage = newestFirst.find((image) => /after/i.test(`${image.alt} ${image.url}`)) ?? sorted.at(-1) ?? null
  return { afterImage, beforeImage }
}
