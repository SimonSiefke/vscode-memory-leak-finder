// Copyright 2026 The Chromium Authors
// BSD-style license: see LICENSE.chromium.
export interface ContextAnalysisResult {
  /** Scopes with dead fields, sorted by their highest-ranked context. */
  scopes: ScopeAnalysis[]
  /** Scripts with live contexts that could not be analyzed because they lack embedded scope metadata. */
  scriptsWithoutScopes: ScriptWithoutScopes[]
}

export interface ScopeAnalysis {
  scopeInfoNodeIndex: number
  scopeInfoNodeId: number
  scriptNodeIndex: number
  scriptNodeId: number
  scriptName: string
  /** Source name of the scope, when available. */
  scopeName?: string | undefined
  scopeStart: number
  scopeEnd: number
  /** Number of context-typed fields in each context belonging to this scope. */
  contextFieldCount: number
  /** Contexts with dead fields, sorted descending by deadFieldsRetainedSizeSum. */
  contexts: ContextAnalysis[]
}

export interface ContextAnalysis {
  contextNodeIndex: number
  contextNodeId: number
  retainedSize: number
  /**
   * The sum of the retained sizes of values in fields classified as dead.
   * This is a ranking heuristic, not the number of bytes that would be
   * reclaimed by clearing the fields.
   */
  deadFieldsRetainedSizeSum: number
  /** Fields classified as dead in this context, sorted descending by retainedSize. */
  deadFields: ContextField[]
}

export interface ContextField {
  name: string
  valueNodeIndex: number
  valueNodeId: number
  valueName: string
  valueType: string
  selfSize: number
  retainedSize: number
}

export interface ScriptWithoutScopes {
  scriptNodeIndex: number
  scriptNodeId: number
  scriptName: string
  /** Number of live context instances belonging to this script. */
  contextCount: number
}
