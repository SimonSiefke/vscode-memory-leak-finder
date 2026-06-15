import { FileDiff, GitPullRequestArrow, MessageSquare, Plus, Timer, Trash2 } from 'lucide-react'
import type React from 'react'

import type { DashboardPullRequest } from '../lib/github'
import { cn, formatRelativeTime } from '../lib/utils'

interface PullRequestCardProps {
  pullRequest: DashboardPullRequest
  selected: boolean
  onSelect: () => void
}

const repoLabels = {
  fork: 'Fork',
  upstream: 'Upstream',
}

export const PullRequestCard = ({ pullRequest, selected, onSelect }: PullRequestCardProps) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-lg border bg-card p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-panel focus:outline-none focus:ring-2 focus:ring-primary/35',
        selected && 'border-primary bg-primary/5',
      )}
    >
      <div className="flex items-start gap-3">
        <img className="mt-0.5 size-8 rounded-full border border-border" src={pullRequest.authorAvatarUrl} alt="" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-medium text-foreground">
              <GitPullRequestArrow className="size-3" />#{pullRequest.number}
            </span>
            <span>{repoLabels[pullRequest.repoKey]}</span>
            <span className="inline-flex min-w-0 items-center gap-1">
              <Timer className="size-3" />
              <span className="truncate">{formatRelativeTime(pullRequest.updatedAt)}</span>
            </span>
          </div>
          <h3 className="mt-2 line-clamp-3 text-sm font-semibold leading-5 text-card-foreground">{pullRequest.title}</h3>
        </div>
      </div>

      {pullRequest.labels.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {pullRequest.labels.slice(0, 3).map((label) => (
            <span
              key={label.name}
              className="max-w-full truncate rounded-md border px-1.5 py-0.5 text-[11px] font-medium"
              style={{ borderColor: `#${label.color}`, backgroundColor: `#${label.color}24` }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        <MetricPill
          className="bg-sky-50 text-sky-800"
          title="Changed files"
          icon={<FileDiff className="size-3.5" />}
          value={formatMetric(pullRequest.changedFiles)}
        />
        <MetricPill
          className="bg-emerald-50 text-emerald-800"
          title="Added lines"
          icon={<Plus className="size-3.5" />}
          value={formatMetric(pullRequest.additions)}
        />
        <MetricPill
          className="bg-rose-50 text-rose-800"
          title="Removed lines"
          icon={<Trash2 className="size-3.5" />}
          value={formatMetric(pullRequest.deletions)}
        />
        <MetricPill
          className="bg-muted text-muted-foreground"
          title="Comments"
          icon={<MessageSquare className="size-3.5" />}
          value={pullRequest.comments.toLocaleString()}
        />
      </div>
    </button>
  )
}

interface MetricPillProps {
  className: string
  title: string
  icon: React.ReactNode
  value: string
}

const MetricPill = ({ className, title, icon, value }: MetricPillProps) => (
  <span className={`inline-flex h-7 min-w-14 items-center justify-center gap-1 rounded-md px-2 font-semibold ${className}`} title={title}>
    {icon}
    {value}
  </span>
)

const formatMetric = (value: number | null): string => {
  return value === null ? '-' : value.toLocaleString()
}
