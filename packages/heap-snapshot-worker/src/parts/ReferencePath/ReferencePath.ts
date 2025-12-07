export interface ReferencePath {
  readonly sourceNodeName: string | null
  readonly sourceNodeType: string | null
  readonly edgeType: string
  readonly edgeName: string
  readonly path: string
}
