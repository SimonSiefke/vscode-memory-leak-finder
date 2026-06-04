import { AlertCircle, ChevronDown, ChevronRight, ExternalLink, FileCode2, ImageIcon, Loader2 } from 'lucide-react'
import Prism from 'prismjs'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-typescript'
import type React from 'react'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

import type { DashboardPullRequest, DiffFile, DiffLine, PullRequestComment, PullRequestImage, PullRequestInspection } from '../lib/github'
import { fetchPullRequestInspection, readCachedPullRequestInspection, writeCachedPullRequestInspection } from '../lib/github'
import { cn, formatDateTime, formatRelativeTime } from '../lib/utils'

interface DetailPanelProps {
  pullRequest: DashboardPullRequest | null
  token: string
}

const emptyCopy = 'Select a PR to inspect branches, review state, labels, and change size.'

export const DetailPanel = ({ pullRequest, token }: DetailPanelProps) => {
  const [inspection, setInspection] = useState<PullRequestInspection | null>(null)
  const [isLoadingInspection, setIsLoadingInspection] = useState(false)
  const [inspectionError, setInspectionError] = useState<string | null>(null)
  const comments = inspection?.comments ?? []
  const diffFiles = inspection?.diffFiles ?? []

  useEffect(() => {
    if (!pullRequest) {
      setInspection(null)
      setInspectionError(null)
      setIsLoadingInspection(false)
      return
    }

    const cached = readCachedPullRequestInspection(pullRequest)
    setInspection(cached)
    setInspectionError(null)

    if (cached) {
      setIsLoadingInspection(false)
      return
    }

    let disposed = false
    setIsLoadingInspection(true)
    fetchPullRequestInspection(token, pullRequest)
      .then((nextInspection) => {
        if (disposed) {
          return
        }
        setInspection(nextInspection)
        writeCachedPullRequestInspection(pullRequest, nextInspection)
      })
      .catch((error) => {
        if (disposed) {
          return
        }
        setInspectionError(error instanceof Error ? error.message : String(error))
      })
      .finally(() => {
        if (!disposed) {
          setIsLoadingInspection(false)
        }
      })

    return () => {
      disposed = true
    }
  }, [pullRequest?.id, pullRequest?.updatedAt, token])

  if (!pullRequest) {
    return (
      <aside className="flex min-h-[520px] items-center justify-center rounded-lg border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
        {emptyCopy}
      </aside>
    )
  }

  return (
    <aside className="max-h-[calc(100vh-2.5rem)] overflow-auto rounded-lg border bg-card shadow-panel">
      <div className="border-b p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{pullRequest.repoFullName}</p>
            <h2 className="mt-2 text-xl font-semibold leading-7 text-card-foreground">{pullRequest.title}</h2>
          </div>
          <a
            href={pullRequest.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border bg-background text-foreground transition hover:border-primary hover:text-primary"
            title="Open on GitHub"
          >
            <ExternalLink className="size-4" />
          </a>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-md bg-primary px-2 py-1 font-medium text-primary-foreground">{pullRequest.statusLabel}</span>
          <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">Updated {formatDateTime(pullRequest.updatedAt)}</span>
          {pullRequest.mergedAt && <span className="rounded-md bg-emerald-100 px-2 py-1 text-emerald-800">Merged {formatDateTime(pullRequest.mergedAt)}</span>}
        </div>
      </div>

      <div className="grid gap-5 p-5">
        <MarkdownBody markdown={inspection?.description || pullRequest.body || 'No description.'} />

        <div className="grid gap-3 xl:grid-cols-2">
          <ImageSection title="Before" image={inspection?.beforeImage ?? null} />
          <ImageSection title="After" image={inspection?.afterImage ?? null} />
        </div>

        <LoadingAndError isLoading={isLoadingInspection && !inspection} error={inspectionError} />

        <section>
          <SectionTitle>Comments</SectionTitle>
          {inspection && (
            comments.length > 0 ? (
              <div className="mt-2 grid gap-3">
                {comments.map((comment) => (
                  <CommentView key={comment.id} comment={comment} />
                ))}
              </div>
            ) : (
              <div className="mt-2 rounded-lg border bg-background p-3 text-sm text-muted-foreground">No comments yet.</div>
            )
          )}
        </section>

        <section>
          <SectionTitle>Code Changes</SectionTitle>
          {inspection && (
            <div className="mt-2 grid gap-3">
              {diffFiles.length > 0 ? (
                diffFiles.map((file) => <DiffFileView key={file.path} file={file} />)
              ) : (
                <div className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">No diff available.</div>
              )}
            </div>
          )}
        </section>
      </div>
    </aside>
  )
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => {
  return <h3 className="text-sm font-semibold">{children}</h3>
}

interface LoadingAndErrorProps {
  isLoading: boolean
  error: string | null
}

const LoadingAndError = ({ isLoading, error }: LoadingAndErrorProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-background p-3 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading preview
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-destructive/35 bg-destructive/10 p-3 text-sm text-destructive">
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
        <p className="break-words">{error}</p>
      </div>
    )
  }

  return null
}

const MarkdownBody = ({ markdown }: { markdown: string }) => {
  return (
    <div className="github-markdown rounded-lg border bg-background p-4 text-sm leading-6">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {markdown}
      </ReactMarkdown>
    </div>
  )
}

const CommentView = ({ comment }: { comment: PullRequestComment }) => {
  return (
    <article className="overflow-hidden rounded-lg border bg-background">
      <div className="flex items-center gap-2 border-b bg-muted/55 px-3 py-2">
        {comment.authorAvatarUrl && <img className="size-6 rounded-full border" src={comment.authorAvatarUrl} alt="" />}
        <a href={comment.url} target="_blank" rel="noreferrer" className="text-sm font-semibold hover:text-primary">
          {comment.author}
        </a>
        <span className="text-xs text-muted-foreground">commented {formatRelativeTime(comment.createdAt)}</span>
      </div>
      <div className="p-3">
        <MarkdownBody markdown={comment.body || '_No comment body._'} />
      </div>
    </article>
  )
}

interface ImageSectionProps {
  title: string
  image: PullRequestImage | null
}

const ImageSection = ({ title, image }: ImageSectionProps) => {
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      {image ? (
        <a href={image.url} target="_blank" rel="noreferrer" className="mt-2 block overflow-hidden rounded-lg border bg-background transition hover:border-primary">
          <img className="max-h-72 w-full object-contain" src={image.url} alt={image.alt || title} />
          <div className="flex items-center gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
            <ImageIcon className="size-3.5" />
            <span className="truncate">{image.source}</span>
          </div>
        </a>
      ) : (
        <div className="mt-2 flex min-h-32 items-center justify-center rounded-lg border border-dashed bg-background p-3 text-sm text-muted-foreground">
          No image found.
        </div>
      )}
    </section>
  )
}

const extensionLanguageMap: Record<string, string> = {
  cjs: 'javascript',
  css: 'css',
  html: 'markup',
  js: 'javascript',
  json: 'json',
  jsx: 'jsx',
  md: 'markdown',
  mjs: 'javascript',
  ts: 'typescript',
  tsx: 'tsx',
}

const getLanguageFromPath = (path: string): string | null => {
  const extension = path.split('.').pop()?.toLowerCase()
  return extension ? extensionLanguageMap[extension] ?? null : null
}

const DiffFileView = ({ file }: { file: DiffFile }) => {
  const [isOpen, setIsOpen] = useState(true)
  const language = getLanguageFromPath(file.path)

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left transition hover:bg-muted"
      >
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          {isOpen ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}
          <FileCode2 className="size-4 shrink-0 text-primary" />
          <span className="truncate">{file.path}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-xs">
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-800">+{file.additions}</span>
          <span className="rounded bg-rose-100 px-1.5 py-0.5 font-medium text-rose-800">-{file.deletions}</span>
        </span>
      </button>
      {isOpen && (
        <div className="overflow-x-auto">
          <div className="min-w-[560px] py-1 font-mono text-xs leading-5">
            {file.lines.map((line, index) => (
              <DiffRow key={`${line.oldLineNumber}-${line.newLineNumber}-${index}`} line={line} language={language} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const HighlightedCode = ({ code, language }: { code: string; language: string | null }) => {
  const grammar = language ? Prism.languages[language] : null

  if (!language || !grammar) {
    return <>{code}</>
  }

  const highlightedCode = Prism.highlight(code, grammar, language)
  return <span className={`language-${language}`} dangerouslySetInnerHTML={{ __html: highlightedCode }} />
}

const DiffRow = ({ line, language }: { line: DiffLine; language: string | null }) => {
  return (
    <div
      className={cn(
        'grid grid-cols-[44px_44px_1fr]',
        line.kind === 'add' && 'bg-emerald-50',
        line.kind === 'remove' && 'bg-rose-50',
        line.kind === 'meta' && 'bg-sky-50 text-sky-800',
      )}
    >
      <span className="select-none border-r px-2 text-right text-muted-foreground">{line.oldLineNumber ?? ''}</span>
      <span className="select-none border-r px-2 text-right text-muted-foreground">{line.newLineNumber ?? ''}</span>
      <code className="whitespace-pre px-2">
        {line.kind === 'add' && <span className="text-emerald-700">+ </span>}
        {line.kind === 'remove' && <span className="text-rose-700">- </span>}
        {line.kind === 'context' && <span className="text-muted-foreground">  </span>}
        {line.content ? <HighlightedCode code={line.content} language={line.kind === 'meta' ? null : language} /> : ' '}
      </code>
    </div>
  )
}
