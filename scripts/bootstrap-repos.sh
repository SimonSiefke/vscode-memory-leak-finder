#!/usr/bin/env bash

set -euo pipefail

workspace_dir="${WORKSPACE_DIR:-$HOME/.cache/repos}"
memory_leak_finder_repo="${MEMORY_LEAK_FINDER_REPO:-https://github.com/SimonSiefke/vscode-memory-leak-finder.git}"
vscode_repo="${VSCODE_REPO:-https://github.com/microsoft/vscode.git}"
nvm_dir="${NVM_DIR:-$HOME/.nvm}"
nvm_version="${NVM_VERSION:-v0.40.5}"
nvm_install_url="${NVM_INSTALL_URL:-https://raw.githubusercontent.com/nvm-sh/nvm/${nvm_version}/install.sh}"

memory_leak_finder_dir="${workspace_dir}/vscode-memory-leak-finder"
vscode_dir="${workspace_dir}/vscode"

log() {
  printf '\n==> %s\n' "$1"
}

die() {
  printf 'Error: %s\n' "$1" >&2
  exit 1
}

require_command() {
  local command_name="$1"
  command -v "$command_name" >/dev/null 2>&1 || die "Required command not found: ${command_name}"
}

download_to_stdout() {
  local url="$1"
  if command -v curl >/dev/null 2>&1; then
    curl --fail --location --silent --show-error "$url"
    return
  fi
  if command -v wget >/dev/null 2>&1; then
    wget --quiet --output-document=- "$url"
    return
  fi
  die "Installing nvm requires curl or wget"
}

install_nvm() {
  log "Installing nvm ${nvm_version}"
  mkdir -p "$nvm_dir"
  download_to_stdout "$nvm_install_url" | PROFILE=/dev/null NVM_DIR="$nvm_dir" bash
}

load_nvm() {
  local nvm_script="${nvm_dir}/nvm.sh"
  if [[ ! -f "$nvm_script" ]]; then
    install_nvm
  fi
  [[ -f "$nvm_script" ]] || die "nvm install did not create ${nvm_script}"

  set +u
  # shellcheck source=/dev/null
  source "$nvm_script"
  set -u

  command -v nvm >/dev/null 2>&1 || die "nvm did not load from ${nvm_script}"
}

clone_or_fetch_repo() {
  local repo_url="$1"
  local repo_dir="$2"
  local repo_name="$3"

  if [[ -d "$repo_dir/.git" ]]; then
    log "Fetching ${repo_name}"
    git -C "$repo_dir" fetch --prune origin
    return
  fi

  if [[ -e "$repo_dir" ]]; then
    die "${repo_dir} exists but is not a git repository"
  fi

  log "Cloning ${repo_name}"
  git clone "$repo_url" "$repo_dir"
}

use_repo_node() {
  local repo_dir="$1"
  local repo_name="$2"

  if [[ ! -f "$repo_dir/.nvmrc" ]]; then
    die "${repo_name} does not contain a .nvmrc file at ${repo_dir}/.nvmrc"
  fi

  log "Using Node from ${repo_name} .nvmrc"
  set +u
  nvm install
  nvm use
  set -u
  printf 'node: %s\n' "$(node --version)"
  printf 'npm: %s\n' "$(npm --version)"
}

install_dependencies() {
  local repo_dir="$1"
  local repo_name="$2"
  shift 2

  log "Installing dependencies for ${repo_name}"
  (
    cd "$repo_dir"
    use_repo_node "$repo_dir" "$repo_name"
    "$@"
  )
}

main() {
  require_command git
  mkdir -p "$workspace_dir"
  load_nvm

  clone_or_fetch_repo "$memory_leak_finder_repo" "$memory_leak_finder_dir" "vscode-memory-leak-finder"
  install_dependencies "$memory_leak_finder_dir" "vscode-memory-leak-finder" npm ci

  clone_or_fetch_repo "$vscode_repo" "$vscode_dir" "VS Code"
  install_dependencies "$vscode_dir" "VS Code" npm install

  log "Bootstrap complete"
  printf 'Workspace: %s\n' "$workspace_dir"
  printf 'vscode-memory-leak-finder: %s\n' "$memory_leak_finder_dir"
  printf 'VS Code: %s\n' "$vscode_dir"
  printf 'VS Code launcher: %s\n' "$vscode_dir/scripts/code.sh"
}

main "$@"
