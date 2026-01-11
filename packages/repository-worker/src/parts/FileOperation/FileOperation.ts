interface CopyOperation {
  from: string
  to: string
  type: 'copy'
}

interface MkdirOperation {
  path: string
  type: 'mkdir'
}

interface RemoveOperation {
  from: string
  type: 'remove'
}

interface WriteOperation {
  content: string
  path: string
  type: 'write'
}

export type FileOperation = CopyOperation | MkdirOperation | RemoveOperation | WriteOperation
