import * as CompareDisposablesWithLocation from '../CompareDisposablesWithLocation/CompareDisposablesWithLocation.ts'

type DisposableItemWithDelta = {
  readonly delta: number
  readonly [key: string]: unknown
}

const hasDifference = (item: DisposableItemWithDelta): boolean => {
  return item.delta > 0
}

export const compareDisposablesWithLocationDifference = async (before: readonly unknown[], after: { result: readonly unknown[]; scriptMap: unknown }): Promise<readonly DisposableItemWithDelta[]> => {
  const result = await CompareDisposablesWithLocation.compareDisposablesWithLocation(before, after)
  const filtered = result.filter(hasDifference)
  return filtered
}
