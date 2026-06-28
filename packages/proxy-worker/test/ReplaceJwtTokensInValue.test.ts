import { afterEach, expect, jest, test } from '@jest/globals'
import * as ReplaceJwtTokensInValue from '../src/parts/ReplaceJwtTokensInValue/ReplaceJwtTokensInValue.ts'

afterEach(() => {
  jest.restoreAllMocks()
})

test('replaceJwtTokensInValue - refreshes copilot token timestamps and related fields', async () => {
  jest.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000)

  const result = await ReplaceJwtTokensInValue.replaceJwtTokensInValue({
    expires_at: 1_700_000_123,
    iat: 1_700_000_456,
    token: 'tid=abc;exp=789;iat=111;sku=plus_monthly_subscriber_quota',
  })

  expect(result).toEqual({
    expires_at: 1_700_000_123,
    iat: 1_700_000_456,
    token: 'tid=abc;exp=789;iat=111;sku=plus_monthly_subscriber_quota',
  })
})

test('replaceJwtTokensInValue - preserves signed bearer copilot tokens unchanged', async () => {
  jest.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000)

  const result = await ReplaceJwtTokensInValue.replaceJwtTokensInValue('Bearer tid=abc;exp=789;iat=111;sku=plus_monthly_subscriber_quota')

  expect(result).toBe('Bearer tid=abc;exp=789;iat=111;sku=plus_monthly_subscriber_quota')
})
