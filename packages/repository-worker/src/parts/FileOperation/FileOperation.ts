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

export type FileOperation = CopyOperation | MkdirOperation | RemoveOperation
