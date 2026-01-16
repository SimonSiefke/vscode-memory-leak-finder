export interface FunctionStatistics {
  [functionName: string]: number
}

export interface TransformOptions {
  filename?: string
  includeLocation?: boolean
  excludePatterns?: string[]
}

export interface TrackingConfig {
  enabled: boolean
  includeLocation: boolean
  excludePatterns: string[]
}

export interface VSCodeTrackerOptions {
  headless?: boolean
  devtools?: boolean
  remoteDebuggingPort?: number
  vscodeUrl?: string
}
