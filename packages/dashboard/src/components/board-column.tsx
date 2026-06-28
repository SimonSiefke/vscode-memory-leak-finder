import type { DashboardPullRequest } from '../lib/github'
import { PullRequestCard } from './pr-card'

interface BoardColumnProps {
  title: string
  description: string
  pullRequests: DashboardPullRequest[]
  selectedId: string | null
  onSelect: (pullRequest: DashboardPullRequest) => void
}

export const BoardColumn = ({ title, description, pullRequests, selectedId, onSelect }: BoardColumnProps) => {
  return (
    <section className="flex min-h-[380px] min-w-[280px] flex-1 flex-col rounded-lg border bg-muted/45">
      <div className="border-b px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          <span className="rounded-md bg-background px-2 py-1 text-xs font-semibold">{pullRequests.length}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-3 p-3">
        {pullRequests.length > 0 ? (
          pullRequests.map((pullRequest) => (
            <PullRequestCard
              key={pullRequest.id}
              pullRequest={pullRequest}
              selected={pullRequest.id === selectedId}
              onSelect={() => onSelect(pullRequest)}
            />
          ))
        ) : (
          <div className="rounded-lg border border-dashed bg-background p-4 text-sm text-muted-foreground">Nothing here.</div>
        )}
      </div>
    </section>
  )
}
