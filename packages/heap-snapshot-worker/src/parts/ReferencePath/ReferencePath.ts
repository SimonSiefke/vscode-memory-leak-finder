export interface ReferencePath {
  readonly edgeName: string
  readonly edgeType: string
  readonly path: string
  readonly sourceNodeName: string | null
  readonly sourceNodeType: string | null
}
