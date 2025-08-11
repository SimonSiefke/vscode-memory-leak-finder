export interface GitHubFileErrorOptions {
  file: string
  line?: number
  col?: number
  title?: string
}

const escape = (value: string): string => {
  return value.replaceAll('\n', '%0A').replaceAll('\r', '%0D')
}

export const getGitHubFileErrorMessage = (
  message: string,
  options: GitHubFileErrorOptions,
): string => {
  const parts: string[] = []
  parts.push('::error')
  const annotations: string[] = []
  if (options.file) {
    annotations.push(`file=${options.file}`)
  }
  if (options.line) {
    annotations.push(`line=${options.line}`)
  }
  if (options.col) {
    annotations.push(`col=${options.col}`)
  }
  if (options.title) {
    annotations.push(`title=${escape(options.title)}`)
  }
  const annotationPrefix = annotations.length > 0 ? ` ${annotations.join(',')}` : ''
  const text = escape(message)
  return `${parts.join('')}${annotationPrefix}::${text}\n`
}


