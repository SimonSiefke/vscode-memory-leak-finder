import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Filter,
  GitPullRequest,
  KeyRound,
  Loader2,
  RefreshCw,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import { BoardColumn } from './components/board-column'
import { DetailPanel } from './components/detail-panel'
import type { DashboardPullRequest, RepoKey } from './lib/github'
import { fetchDashboardData, isGitHubRateLimitError, readCachedDashboardData, writeCachedDashboardData } from './lib/github'
import { cn, formatDateTime, formatRelativeTime } from './lib/utils'

const statusColumns: Array<{
  id: 'draft' | 'review' | 'merged'
  title: string
  description: string
  matches: (pullRequest: DashboardPullRequest) => boolean
}> = [
  {
    id: 'draft',
    title: 'Draft',
    description: 'Still being shaped before review.',
    matches: (pullRequest) => pullRequest.status === 'draft',
  },
  {
    id: 'review',
    title: 'In review',
    description: 'Open PRs that are ready, waiting, or need updates.',
    matches: (pullRequest) => pullRequest.state === 'open' && pullRequest.status !== 'draft',
  },
  {
    id: 'merged',
    title: 'Merged',
    description: 'Landed upstream or in the fork.',
    matches: (pullRequest) => pullRequest.status === 'merged',
  },
]

const repoFilters: Array<{ value: 'all' | RepoKey; label: string }> = [
  { value: 'all', label: 'All repos' },
  { value: 'fork', label: 'SimonSiefke/vscode' },
  { value: 'upstream', label: 'microsoft/vscode' },
]

const tokenStorageKey = 'vscode-leak-dashboard.github-token'
const rateLimitHelp = 'Use a GitHub token to raise the limit, or keep working from the last cached result.'

export const App = () => {
  const didLoad = useRef(false)
  const [route, setRoute] = useState(() => window.location.hash.replace('#', '') || '/')
  const [pullRequests, setPullRequests] = useState<DashboardPullRequest[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [repoFilter, setRepoFilter] = useState<'all' | RepoKey>('all')
  const [query, setQuery] = useState('')
  const [token, setToken] = useState(() => localStorage.getItem(tokenStorageKey) ?? '')
  const [rateLimitRemaining, setRateLimitRemaining] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cacheNotice, setCacheNotice] = useState<string | null>(null)

  const applyData = (data: { pullRequests: DashboardPullRequest[]; rateLimitRemaining: string | null; fetchedAt: string }) => {
    setPullRequests(data.pullRequests)
    setRateLimitRemaining(data.rateLimitRemaining)
    setFetchedAt(data.fetchedAt)
    setSelectedId((current) => current ?? data.pullRequests[0]?.id ?? null)
  }

  const navigate = (nextRoute: '/' | '/token') => {
    window.location.hash = nextRoute === '/' ? '' : nextRoute
    setRoute(nextRoute)
  }

  const saveToken = (nextToken: string) => {
    const trimmed = nextToken.trim()
    setToken(trimmed)
    if (trimmed) {
      localStorage.setItem(tokenStorageKey, trimmed)
    } else {
      localStorage.removeItem(tokenStorageKey)
    }
  }

  const load = async (nextToken = token) => {
    setIsLoading(true)
    setError(null)
    setCacheNotice(null)
    try {
      const data = await fetchDashboardData(nextToken.trim())
      applyData(data)
      writeCachedDashboardData(data)
    } catch (error) {
      const cached = readCachedDashboardData()
      if (cached) {
        applyData(cached)
        setCacheNotice(`Showing cached GitHub data from ${formatDateTime(cached.fetchedAt)}.`)
      }
      setError(error instanceof Error ? error.message : String(error))
      if (isGitHubRateLimitError(error) && !nextToken.trim()) {
        setError(`${error instanceof Error ? error.message : String(error)} ${rateLimitHelp}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const onHashChange = () => {
      setRoute(window.location.hash.replace('#', '') || '/')
    }

    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    if (didLoad.current) {
      return
    }
    didLoad.current = true

    const cached = readCachedDashboardData()
    if (cached) {
      applyData(cached)
      setCacheNotice(`Showing cached GitHub data from ${formatDateTime(cached.fetchedAt)}.`)
      setIsLoading(false)
      return
    }

    void load()
  }, [])

  useEffect(() => {
    if (token.trim()) {
      localStorage.setItem(tokenStorageKey, token.trim())
    } else {
      localStorage.removeItem(tokenStorageKey)
    }
  }, [token])

  const filteredPullRequests = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase()
    return pullRequests.filter((pullRequest) => {
      if (repoFilter !== 'all' && pullRequest.repoKey !== repoFilter) {
        return false
      }
      if (!lowerQuery) {
        return true
      }
      return [
        pullRequest.title,
        pullRequest.repoFullName,
        pullRequest.number.toString(),
        pullRequest.labels.map((label) => label.name).join(' '),
        pullRequest.statusLabel,
      ]
        .join(' ')
        .toLowerCase()
        .includes(lowerQuery)
    })
  }, [pullRequests, query, repoFilter])

  const selectedPullRequest = pullRequests.find((pullRequest) => pullRequest.id === selectedId) ?? filteredPullRequests[0] ?? null
  const totals = getTotals(pullRequests)

  if (route === '/token') {
    return (
      <AuthPage
        token={token}
        isLoading={isLoading}
        error={error}
        onBack={() => navigate('/')}
        onClear={() => saveToken('')}
        onSave={(nextToken) => {
          saveToken(nextToken)
          navigate('/')
          void load(nextToken)
        }}
      />
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="border-b bg-card">
        <div className="mx-auto flex max-w-[1720px] flex-col gap-5 px-5 py-5 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <GitPullRequest className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">VS Code memory leaks</p>
                  <h1 className="text-2xl font-semibold tracking-normal">PR Dashboard</h1>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusPill icon={<CheckCircle2 className="size-4" />} label={`${totals.open} open`} />
              <StatusPill icon={<GitPullRequest className="size-4" />} label={`${totals.upstream} upstream`} />
              {fetchedAt && <StatusPill icon={<RefreshCw className="size-4" />} label={formatRelativeTime(fetchedAt)} />}
              {rateLimitRemaining && (
                <StatusPill icon={<SlidersHorizontal className="size-4" />} label={`${rateLimitRemaining} API calls left`} />
              )}
              <button
                type="button"
                onClick={() => navigate('/token')}
                className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
              >
                <KeyRound className="size-4" />
                {token ? 'Token saved' : 'GitHub token'}
              </button>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search title, label, repo, or number"
                />
              </label>

              <div className="flex items-center rounded-md border bg-background p-1">
                <Filter className="ml-2 size-4 text-muted-foreground" />
                {repoFilters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setRepoFilter(filter.value)}
                    className={cn(
                      'h-8 rounded px-3 text-xs font-medium text-muted-foreground transition',
                      repoFilter === filter.value && 'bg-primary text-primary-foreground',
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-[auto]">
              <button
                type="button"
                onClick={() => void load()}
                disabled={isLoading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/35 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p className="break-words">{error}</p>
            </div>
          )}

          {cacheNotice && <div className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">{cacheNotice}</div>}
        </div>
      </div>

      <div className="mx-auto grid max-w-[1720px] gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_560px] lg:px-8">
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-4">
            {statusColumns.map((column) => (
              <BoardColumn
                key={column.id}
                title={column.title}
                description={column.description}
                pullRequests={filteredPullRequests.filter(column.matches)}
                selectedId={selectedPullRequest?.id ?? selectedId}
                onSelect={(pullRequest) => setSelectedId(pullRequest.id)}
              />
            ))}
          </div>
        </div>

        <div className="lg:sticky lg:top-5 lg:self-start">
          <PreviewErrorBoundary key={selectedPullRequest?.id ?? 'empty'}>
            <DetailPanel pullRequest={selectedPullRequest} token={token} />
          </PreviewErrorBoundary>
        </div>
      </div>
    </main>
  )
}

interface StatusPillProps {
  icon: React.ReactNode
  label: string
}

const StatusPill = ({ icon, label }: StatusPillProps) => (
  <div className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm text-muted-foreground">
    {icon}
    {label}
  </div>
)

class PreviewErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = {
    error: null,
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <aside className="rounded-lg border border-destructive/35 bg-destructive/10 p-4 text-sm text-destructive shadow-panel">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-semibold">Preview failed to render.</p>
              <p className="mt-1 break-words">{this.state.error.message}</p>
            </div>
          </div>
        </aside>
      )
    }

    return this.props.children
  }
}

interface AuthPageProps {
  token: string
  isLoading: boolean
  error: string | null
  onBack: () => void
  onClear: () => void
  onSave: (token: string) => void
}

const AuthPage = ({ token, isLoading, error, onBack, onClear, onSave }: AuthPageProps) => {
  const [draftToken, setDraftToken] = useState(token)

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="border-b bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <KeyRound className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">GitHub</p>
              <h1 className="text-2xl font-semibold tracking-normal">Token</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium transition hover:border-primary hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            Dashboard
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-3xl gap-4 px-5 py-6">
        <section className="rounded-lg border bg-card p-5 shadow-panel">
          <label className="grid gap-2">
            <span className="text-sm font-semibold">Personal access token</span>
            <input
              className="h-11 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={draftToken}
              onChange={(event) => setDraftToken(event.target.value)}
              placeholder="ghp_..."
              type="password"
              autoFocus
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSave(draftToken)}
              disabled={isLoading}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save and refresh
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftToken('')
                onClear()
              }}
              className="inline-flex h-10 items-center gap-2 rounded-md border bg-background px-4 text-sm font-medium transition hover:border-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" />
              Clear
            </button>
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-md border bg-background px-4 text-sm font-medium transition hover:border-primary hover:text-primary"
            >
              <KeyRound className="size-4" />
              Create token
            </a>
          </div>
        </section>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/35 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p className="break-words">{error}</p>
          </div>
        )}
      </div>
    </main>
  )
}

const getTotals = (pullRequests: DashboardPullRequest[]) => {
  return {
    open: pullRequests.filter((pullRequest) => pullRequest.state === 'open').length,
    upstream: pullRequests.filter((pullRequest) => pullRequest.repoKey === 'upstream').length,
  }
}
