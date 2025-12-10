export const getMockFileName = (hostname: string, pathname: string, method: string): string => {
  // Convert URL to filename format: hostname_pathname_method.json
  const hostnameSanitized = hostname.replace(/[^a-zA-Z0-9]/g, '_')
  const pathnameSanitized = pathname.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+/, '')
  const methodLower = method.toLowerCase()

  // Special handling for specific endpoints
  if (hostname.includes('applicationinsights.azure.com')) {
    return 'applicationinsights_azure_com.json'
  }

  if (hostname === 'api.github.com' && pathname === '/copilot_internal/user') {
    if (methodLower === 'options') {
      return 'api_github_com_copilot_internal_user_options.json'
    }
    return 'api_github_com_copilot_internal_user_get.json'
  }

  if (hostname === 'api.github.com' && pathname === '/copilot_internal/v2/token') {
    return 'api_github_com_copilot_internal_v2_token.json'
  }

  if (hostname === 'main.vscode-cdn.net' && pathname === '/extensions/chat.json') {
    return 'main_vscode_cdn_net_extensions_chat_json.json'
  }

  if (hostname === 'api.github.com' && pathname === '/user') {
    return 'api_github_com_user.json'
  }

  if (hostname === 'api.individual.githubcopilot.com' && pathname === '/agents') {
    return 'api_individual_githubcopilot_com_agents.json'
  }

  // Generic fallback
  const pathPart = pathnameSanitized || 'root'
  return `${hostnameSanitized}_${pathPart}_${methodLower}.json`
}
