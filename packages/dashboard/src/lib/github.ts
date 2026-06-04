import { Octokit } from '@octokit/rest'

export type RepoKey = 'fork' | 'upstream'

export type ReviewState = 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING'

export type DashboardStatus = 'draft' | 'changes-requested' | 'review-ready' | 'in-review' | 'merged' | 'closed'

export interface GitHubLabel {
  name: string
  color: string
}

interface SearchIssue {
  number: number
  title: string
  html_url: string
  state: 'open' | 'closed'
  user: {
    login: string
    avatar_url: string
  }
  labels: GitHubLabel[]
  comments: number
  created_at: string
  updated_at: string
  closed_at: string | null
  body: string | null
  pull_request: {
    html_url: string
    merged_at: string | null
  }
}

interface PullRequestDetails {
  number: number
  html_url: string
  state: 'open' | 'closed'
  title: string
  body: string | null
  draft: boolean
  updated_at: string
  merged_at: string | null
  mergeable_state?: string | null
  additions?: number
  deletions?: number
  changed_files?: number
  commits?: number
  base: {
    ref: string
    repo: {
      full_name: string
    }
  }
  head: {
    ref: string
    repo: {
      full_name: string
    } | null
  }
  requested_reviewers: Array<{ login: string }>
  requested_teams: Array<{ name: string }>
  user: {
    login: string
    avatar_url: string
  }
}

export interface Review {
  id: number
  state: ReviewState
  user: {
    login: string
    avatar_url: string
  } | null
  submitted_at: string | null
  body: string | null
}

export interface DashboardPullRequest {
  id: string
  repoKey: RepoKey
  repoFullName: string
  number: number
  title: string
  url: string
  state: 'open' | 'closed'
  status: DashboardStatus
  statusLabel: string
  author: string
  authorAvatarUrl: string
  labels: GitHubLabel[]
  createdAt: string
  updatedAt: string
  closedAt: string | null
  mergedAt: string | null
  body: string
  draft: boolean
  mergeableState: string | null
  additions: number | null
  deletions: number | null
  changedFiles: number | null
  commits: number | null
  comments: number
  baseRef: string
  headRef: string
  requestedReviewers: string[]
  reviews: Review[]
}

export interface DashboardData {
  pullRequests: DashboardPullRequest[]
  rateLimitRemaining: string | null
  fetchedAt: string
}

export const dashboardCacheKey = 'vscode-leak-dashboard.github-data'
const pullRequestDetailCachePrefix = 'vscode-leak-dashboard.pr-detail:'

export interface DiffLine {
  kind: 'context' | 'add' | 'remove' | 'meta'
  oldLineNumber: number | null
  newLineNumber: number | null
  content: string
}

export interface DiffFile {
  path: string
  additions: number
  deletions: number
  lines: DiffLine[]
}

export interface PullRequestImage {
  alt: string
  url: string
  source: string
  createdAt: string
}

export interface PullRequestComment {
  id: number
  author: string
  authorAvatarUrl: string
  body: string
  createdAt: string
  updatedAt: string
  url: string
}

export interface PullRequestInspection {
  prId: string
  updatedAt: string
  description: string
  comments: PullRequestComment[]
  diffFiles: DiffFile[]
  beforeImage: PullRequestImage | null
  afterImage: PullRequestImage | null
  fetchedAt: string
}

const endpoints = [
  {
    repoKey: 'fork' as const,
    repoFullName: 'SimonSiefke/vscode',
    owner: 'SimonSiefke',
    repo: 'vscode',
    query: 'repo:SimonSiefke/vscode is:pr is:open',
  },
  {
    repoKey: 'upstream' as const,
    repoFullName: 'microsoft/vscode',
    owner: 'microsoft',
    repo: 'vscode',
    query: 'repo:microsoft/vscode is:pr author:SimonSiefke',
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
    q: query,
    sort: 'updated',
    order: 'desc',
    per_page: 100,
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
    owner,
    repo,
    state: 'open',
    sort: 'updated',
    direction: 'desc',
    per_page: 100,
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
    return { status: 'merged', label: 'Merged' }
  }
  if (issue.state === 'closed') {
    return { status: 'closed', label: 'Closed' }
  }
  if (pullRequest?.draft) {
    return { status: 'draft', label: 'Draft' }
  }
  if ((pullRequest?.requested_reviewers.length ?? 0) > 0 || (pullRequest?.requested_teams.length ?? 0) > 0) {
    return { status: 'in-review', label: 'In review' }
  }

  return { status: 'review-ready', label: 'Ready' }
}

const toDashboardPullRequest = (
  issue: SearchIssue,
  pullRequest: PullRequestDetails | undefined,
  repoKey: RepoKey,
  repoFullName: string,
): DashboardPullRequest => {
  const { status, label } = getDashboardStatus(issue, pullRequest)
  return {
    id: `${repoFullName}#${issue.number}`,
    repoKey,
    repoFullName,
    number: issue.number,
    title: pullRequest?.title ?? issue.title,
    url: pullRequest?.html_url ?? issue.pull_request.html_url ?? issue.html_url,
    state: issue.state,
    status,
    statusLabel: label,
    author: pullRequest?.user.login ?? issue.user.login,
    authorAvatarUrl: pullRequest?.user.avatar_url ?? issue.user.avatar_url,
    labels: issue.labels,
    createdAt: issue.created_at,
    updatedAt: pullRequest?.updated_at ?? issue.updated_at,
    closedAt: issue.closed_at,
    mergedAt: issue.pull_request.merged_at ?? pullRequest?.merged_at ?? null,
    body: pullRequest?.body ?? issue.body ?? '',
    draft: pullRequest?.draft ?? false,
    mergeableState: pullRequest?.mergeable_state ?? null,
    additions: pullRequest?.additions ?? null,
    deletions: pullRequest?.deletions ?? null,
    changedFiles: pullRequest?.changed_files ?? null,
    commits: pullRequest?.commits ?? null,
    comments: issue.comments,
    baseRef: pullRequest ? `${pullRequest.base.repo.full_name}:${pullRequest.base.ref}` : repoFullName,
    headRef: pullRequest ? `${pullRequest.head.repo?.full_name ?? 'unknown'}:${pullRequest.head.ref}` : 'Open on GitHub for branch details',
    requestedReviewers: pullRequest
      ? [...pullRequest.requested_reviewers.map((reviewer) => reviewer.login), ...pullRequest.requested_teams.map((team) => team.name)]
      : [],
    reviews: [],
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
            repo: endpoint.repo,
            pull_number: issue.number,
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
    pullRequests,
    rateLimitRemaining,
    fetchedAt: new Date().toISOString(),
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
      owner,
      repo,
      pull_number: pullRequest.number,
      mediaType: {
        format: 'diff',
      },
    }),
    octokit.paginate(octokit.rest.issues.listComments, {
      owner,
      repo,
      issue_number: pullRequest.number,
      per_page: 100,
    }),
  ])

  const imageSources = [
    {
      source: 'PR description',
      body: pullRequest.body,
      createdAt: pullRequest.updatedAt,
    },
    ...comments
      .filter((comment) => comment.user?.login.toLowerCase().includes('memory-leak-finder-bot'))
      .map((comment) => ({
        source: comment.user?.login ?? 'memory-leak-finder-bot',
        body: comment.body ?? '',
        createdAt: comment.updated_at ?? comment.created_at,
      })),
  ]

  const images = imageSources.flatMap((source) => extractImages(source.body, source.source, source.createdAt))
  const { beforeImage, afterImage } = pickBeforeAfterImages(images)
  const renderedComments = comments.map((comment) => ({
    id: comment.id,
    author: comment.user?.login ?? 'unknown',
    authorAvatarUrl: comment.user?.avatar_url ?? '',
    body: comment.body ?? '',
    createdAt: comment.created_at,
    updatedAt: comment.updated_at ?? comment.created_at,
    url: comment.html_url,
  }))

  return {
    prId: pullRequest.id,
    updatedAt: pullRequest.updatedAt,
    description: pullRequest.body,
    comments: renderedComments,
    diffFiles: parseUnifiedDiff(String(diffResponse.data)),
    beforeImage,
    afterImage,
    fetchedAt: new Date().toISOString(),
  }
}

const getPullRequestDetailCacheKey = (pullRequest: DashboardPullRequest): string => {
  return `${pullRequestDetailCachePrefix}${pullRequest.id}`
}

const normalizePullRequestInspection = (inspection: PullRequestInspection): PullRequestInspection => {
  return {
    ...inspection,
    description: inspection.description ?? '',
    comments: Array.isArray(inspection.comments) ? inspection.comments : [],
    diffFiles: Array.isArray(inspection.diffFiles) ? inspection.diffFiles : [],
    beforeImage: inspection.beforeImage ?? null,
    afterImage: inspection.afterImage ?? null,
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
        path: '',
        additions: 0,
        deletions: 0,
        lines: [],
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
      currentFile.lines.push({ kind: 'meta', oldLineNumber: null, newLineNumber: null, content: line })
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
      currentFile.lines.push({ kind: 'add', oldLineNumber: null, newLineNumber: newLine, content: line.slice(1) })
      newLine++
      continue
    }

    if (line.startsWith('-')) {
      currentFile.deletions++
      currentFile.lines.push({ kind: 'remove', oldLineNumber: oldLine, newLineNumber: null, content: line.slice(1) })
      oldLine++
      continue
    }

    currentFile.lines.push({
      kind: 'context',
      oldLineNumber: oldLine,
      newLineNumber: newLine,
      content: line.startsWith(' ') ? line.slice(1) : line,
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
    images.push({ alt: `${match[1]} ${getNearbyText(body, match.index)}`.trim(), url: match[2], source, createdAt })
  }

  while ((match = htmlImageRegex.exec(body))) {
    images.push({ alt: getNearbyText(body, match.index), url: match[1], source, createdAt })
  }

  return images
}

const getNearbyText = (body: string, index: number): string => {
  return body.slice(Math.max(0, index - 160), Math.min(body.length, index + 160))
}

const pickBeforeAfterImages = (
  images: PullRequestImage[],
): { beforeImage: PullRequestImage | null; afterImage: PullRequestImage | null } => {
  const sorted = [...images].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  const beforeImage = [...sorted].reverse().find((image) => /before/i.test(`${image.alt} ${image.url}`)) ?? sorted.at(-2) ?? null
  const afterImage = [...sorted].reverse().find((image) => /after/i.test(`${image.alt} ${image.url}`)) ?? sorted.at(-1) ?? null
  return { beforeImage, afterImage }
}
