export interface FunctionStatistics {
  readonly [functionName: string]: number
}

export interface TransformOptions {
  readonly scriptId?: number
  readonly filename?: string
  readonly includeLocation?: boolean
}

export interface TrackingConfig {
  readonly enabled: boolean
  readonly includeLocation: boolean
  readonly excludePatterns: string[]
}

export interface VSCodeTrackerOptions {
  readonly headless?: boolean
  readonly devtools?: boolean
  readonly remoteDebuggingPort?: number
  readonly vscodeUrl?: string
}
