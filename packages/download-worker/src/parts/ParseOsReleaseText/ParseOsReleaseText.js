// based on microsoft/playwright/packages/playwright-core/src/utils/hostPlatform.ts (License Apache 2.0)

export const parseOSReleaseText = (osReleaseText) => {
  const fields = Object.create(null)
  for (const line of osReleaseText.split('\n')) {
    const tokens = line.split('=')
    const name = tokens.shift()
    let value = tokens.join('=').trim()
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, value.length - 1)
    }
    if (!name) {
      continue
    }
    fields[name.toLowerCase()] = value
  }
  return fields
}
