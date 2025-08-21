interface CopyOperation {
  type: 'copy'
  from: string
  to: string
}

interface MkdirOperation {
  type: 'mkdir'
  path: string
}

interface RemoveOperation {
  type: 'remove'
  from: string
}

export type FileOperation = CopyOperation | MkdirOperation | RemoveOperation
