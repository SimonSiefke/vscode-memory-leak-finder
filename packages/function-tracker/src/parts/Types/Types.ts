export interface FunctionStatistics {
  readonly [functionName: string]: number
}

export interface TransformOptions {
  readonly filename?: string
  readonly includeLocation?: boolean
  readonly minify?: boolean
  readonly scriptId?: number
  readonly trackingMode?: string
}

export interface TrackingConfig {
  readonly enabled: boolean
  readonly excludePatterns: string[]
  readonly includeLocation: boolean
}

export interface VSCodeTrackerOptions {
  readonly devtools?: boolean
  readonly headless?: boolean
  readonly remoteDebuggingPort?: number
  readonly vscodeUrl?: string
}
