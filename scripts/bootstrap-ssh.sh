#!/usr/bin/env bash

set -euo pipefail

remote="${1:-}"
local_dotfiles_dir="${DOTFILES_DIR:-/home/simon/dotfiles}"
remote_dotfiles_dir="${REMOTE_DOTFILES_DIR:-dotfiles}"
remote_workspace_dir="${REMOTE_WORKSPACE_DIR:-\$HOME/.cache/repos}"
run_remote_bootstrap="${RUN_REMOTE_BOOTSTRAP:-1}"
remote_bootstrap_path="${REMOTE_BOOTSTRAP_PATH:-/tmp/vscode-memory-leak-finder-bootstrap-repos.sh}"
dotfiles_tmp_dir=""

log() {
  printf '\n==> %s\n' "$1"
}

die() {
  printf 'Error: %s\n' "$1" >&2
  exit 1
}

usage() {
  cat <<'EOF'
Usage: scripts/bootstrap-ssh.sh user@host

Archives /home/simon/dotfiles, copies it to the remote user's ~/dotfiles
directory, runs the remote-safe dotfiles setup, then uploads and runs
scripts/bootstrap-repos.sh on the remote host.

Environment:
  DOTFILES_DIR=path             Local dotfiles repo to mirror.
  REMOTE_DOTFILES_DIR=path      Remote destination for the dotfiles repo.
                                Defaults to dotfiles, relative to remote home.
  REMOTE_WORKSPACE_DIR=path     Workspace used by bootstrap-repos.sh.
  RUN_REMOTE_BOOTSTRAP=0        Only copy dotfiles and run dotfiles setup.
  REMOTE_BOOTSTRAP_PATH=path    Upload path for bootstrap-repos.sh.
EOF
}

require_command() {
  local command_name="$1"
  command -v "$command_name" >/dev/null 2>&1 || die "Required command not found: ${command_name}"
}

get_script_dir() {
  local source="${BASH_SOURCE[0]}"
  local dir
  dir="$(cd "$(dirname "$source")" && pwd)"
  printf '%s\n' "$dir"
}

ensure_local_dotfiles_repo() {
  [[ -d "$local_dotfiles_dir" ]] || die "Dotfiles directory not found: ${local_dotfiles_dir}"
  [[ -d "${local_dotfiles_dir}/.git" ]] || die "Dotfiles directory is not a git repository: ${local_dotfiles_dir}"
  [[ -f "${local_dotfiles_dir}/ubuntu/os/setup-remote.sh" ]] || die "Missing remote setup script: ${local_dotfiles_dir}/ubuntu/os/setup-remote.sh"
}

ensure_safe_remote_dotfiles_dir() {
  case "$remote_dotfiles_dir" in
    '' | / | . | .. | *$'\n'*)
      die "Refusing unsafe REMOTE_DOTFILES_DIR: ${remote_dotfiles_dir}"
      ;;
  esac
}

ensure_remote_tar() {
  log "Checking remote tar"
  ssh "$remote" 'command -v tar >/dev/null 2>&1 || { printf "%s\n" "tar is missing on the remote host" >&2; exit 1; }'
}

preseed_remote_z() {
  local z_path="${HOME}/z.sh"
  local fallback_z_path="${dotfiles_tmp_dir}/z.sh"

  log "Preseeding remote z.sh"
  if [[ -f "$z_path" ]]; then
    scp "$z_path" "${remote}:z.sh"
    return
  fi

  printf '%s\n' '# z.sh placeholder created by bootstrap-ssh.sh' >"$fallback_z_path"
  scp "$fallback_z_path" "${remote}:z.sh"
}

ensure_remote_download_command() {
  log "Checking remote download command"
  ssh "$remote" 'if command -v curl >/dev/null 2>&1 || command -v wget >/dev/null 2>&1; then exit 0; fi
if command -v apt-get >/dev/null 2>&1; then
  if [ "$(id -u)" -eq 0 ]; then
    env DEBIAN_FRONTEND=noninteractive apt-get update &&
      env DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends curl
  elif command -v sudo >/dev/null 2>&1; then
    sudo env DEBIAN_FRONTEND=noninteractive apt-get update &&
      sudo env DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends curl
  else
    printf "%s\n" "curl and wget are missing, and sudo is not available" >&2
    exit 1
  fi
else
  printf "%s\n" "Installing z requires curl or wget on the remote host" >&2
  exit 1
fi'
}

create_dotfiles_archive() {
  local archive_path="$1"

  log "Creating dotfiles archive"
  tar -C "$local_dotfiles_dir" -czf "$archive_path" .
}

copy_dotfiles_repo() {
  local archive_path="$1"
  local remote_archive="/tmp/vscode-memory-leak-finder-dotfiles.tar.gz"

  log "Copying dotfiles archive to ${remote}"
  scp "$archive_path" "${remote}:${remote_archive}"

  log "Extracting dotfiles to ${remote}:${remote_dotfiles_dir}"
  ssh "$remote" "rm -rf '$remote_dotfiles_dir' && mkdir -p '$remote_dotfiles_dir' && tar -C '$remote_dotfiles_dir' -xzf '$remote_archive' && rm -f '$remote_archive'"
}

run_dotfiles_setup() {
  log "Running remote dotfiles setup"
  ssh "$remote" "bash '$remote_dotfiles_dir/ubuntu/os/setup-remote.sh' --yes"
}

run_bootstrap() {
  local script_dir="$1"
  local bootstrap_script="${script_dir}/bootstrap-repos.sh"

  [[ -f "$bootstrap_script" ]] || die "Missing bootstrap script: ${bootstrap_script}"

  log "Uploading bootstrap-repos.sh"
  scp "$bootstrap_script" "${remote}:${remote_bootstrap_path}"

  log "Running remote bootstrap"
  ssh "$remote" "chmod +x ${remote_bootstrap_path} && WORKSPACE_DIR=${remote_workspace_dir} ${remote_bootstrap_path}"
}

main() {
  if [[ -z "$remote" || "$remote" == "-h" || "$remote" == "--help" ]]; then
    usage
    if [[ -z "$remote" ]]; then
      exit 1
    fi
    exit 0
  fi

  require_command ssh
  require_command scp
  require_command tar

  local script_dir
  local dotfiles_archive
  script_dir="$(get_script_dir)"
  dotfiles_tmp_dir="$(mktemp -d)"
  dotfiles_archive="${dotfiles_tmp_dir}/dotfiles.tar.gz"
  trap 'rm -rf "$dotfiles_tmp_dir"' EXIT

  ensure_local_dotfiles_repo
  ensure_safe_remote_dotfiles_dir
  preseed_remote_z
  ensure_remote_tar
  ensure_remote_download_command
  create_dotfiles_archive "$dotfiles_archive"
  copy_dotfiles_repo "$dotfiles_archive"
  run_dotfiles_setup

  if [[ "$run_remote_bootstrap" == "1" ]]; then
    run_bootstrap "$script_dir"
  else
    log "Skipping remote bootstrap"
  fi

  log "SSH bootstrap complete"
}

main "$@"
