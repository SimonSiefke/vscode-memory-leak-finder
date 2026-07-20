#!/usr/bin/env bash

set -euo pipefail

remote="${1:-}"
local_dotfiles_dir="${DOTFILES_DIR:-/home/simon/dotfiles}"
remote_dotfiles_dir="${REMOTE_DOTFILES_DIR:-dotfiles}"
remote_workspace_dir="${REMOTE_WORKSPACE_DIR:-\$HOME/.cache/repos}"
run_remote_bootstrap="${RUN_REMOTE_BOOTSTRAP:-1}"
remote_bootstrap_path="${REMOTE_BOOTSTRAP_PATH:-/tmp/vscode-memory-leak-finder-bootstrap-repos.sh}"
local_ssh_dir="${SSH_DIR:-${HOME}/.ssh}"
remote_ssh_dir="${REMOTE_SSH_DIR:-.ssh}"
copy_ssh_keys_enabled="${COPY_SSH_KEYS:-1}"
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
  SSH_DIR=path                  Local SSH directory to mirror for git access.
                                Defaults to ~/.ssh.
  REMOTE_SSH_DIR=path           Remote SSH directory. Defaults to .ssh,
                                relative to remote home.
  COPY_SSH_KEYS=0               Skip copying local SSH keys to the remote.
  START_KASMVNC=0               Skip starting the remote KasmVNC service.
  KASMVNC_DISPLAY=:1            Remote KasmVNC display.
  KASMVNC_WEBSOCKET_PORT=6901   Remote KasmVNC browser port.
  KASMVNC_BIND_ADDRESS=0.0.0.0  Remote KasmVNC bind address.
  KASMVNC_USERNAME=name         KasmVNC login username.
  KASMVNC_PASSWORD=password     KasmVNC login password.
  KASMVNC_GEOMETRY=1920x1080    Remote KasmVNC desktop size.
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

ensure_safe_remote_ssh_dir() {
  case "$remote_ssh_dir" in
    '' | / | . | .. | *$'\n'*)
      die "Refusing unsafe REMOTE_SSH_DIR: ${remote_ssh_dir}"
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

create_ssh_keys_archive() {
  local archive_path="$1"
  local file_list="${dotfiles_tmp_dir}/ssh-files.txt"

  if [[ ! -d "$local_ssh_dir" ]]; then
    log "No local SSH directory found at ${local_ssh_dir}; skipping SSH key copy"
    return 1
  fi

  log "Creating SSH key archive"
  (
    cd "$local_ssh_dir"
    find . -mindepth 1 \( -type f -o -type l \) \
      ! -name 'authorized_keys' \
      ! -name 'authorized_keys2' \
      ! -name '*.sock' \
      ! -name '*.tmp' \
      ! -name 'control*' \
      -print0 >"$file_list"
  )

  if [[ ! -s "$file_list" ]]; then
    log "No local SSH key files found in ${local_ssh_dir}; skipping SSH key copy"
    return 1
  fi

  tar -C "$local_ssh_dir" -chzf "$archive_path" --null -T "$file_list"
}

copy_ssh_keys() {
  local archive_path="$1"
  local remote_archive="/tmp/vscode-memory-leak-finder-ssh-keys.tar.gz"
  local remote_archive_quoted
  local remote_ssh_dir_quoted

  if [[ "$copy_ssh_keys_enabled" != "1" ]]; then
    log "Skipping SSH key copy"
    return
  fi

  create_ssh_keys_archive "$archive_path" || return

  remote_archive_quoted="$(quote_remote_value "$remote_archive")"
  remote_ssh_dir_quoted="$(quote_remote_value "$remote_ssh_dir")"

  log "Copying SSH keys to ${remote}"
  scp "$archive_path" "${remote}:${remote_archive}"

  log "Extracting SSH keys to ${remote}:${remote_ssh_dir}"
  ssh "$remote" "mkdir -p ${remote_ssh_dir_quoted} &&
    tar --no-same-owner --no-same-permissions -C ${remote_ssh_dir_quoted} -xzf ${remote_archive_quoted} &&
    rm -f ${remote_archive_quoted} &&
    chown -R \"\$(id -u):\$(id -g)\" ${remote_ssh_dir_quoted} &&
    chmod 700 ${remote_ssh_dir_quoted} &&
    find ${remote_ssh_dir_quoted} -type d -exec chmod 700 {} + &&
    find ${remote_ssh_dir_quoted} -type f -exec chmod 600 {} + &&
    find ${remote_ssh_dir_quoted} -type f \\( -name '*.pub' -o -name 'known_hosts*' \\) -exec chmod 644 {} +"
}

run_dotfiles_setup() {
  log "Running remote dotfiles setup"
  ssh "$remote" "bash '$remote_dotfiles_dir/ubuntu/os/setup-remote.sh' --yes"
}

quote_remote_value() {
  printf '%q' "$1"
}

append_remote_env_if_set() {
  local env_name="$1"
  local env_value="${!env_name}"
  if [[ -n "${env_value+x}" ]]; then
    printf ' %s=%s' "$env_name" "$(quote_remote_value "$env_value")"
  fi
}

get_remote_bootstrap_env() {
  local remote_env="WORKSPACE_DIR=${remote_workspace_dir}"
  local env_name
  for env_name in \
    START_KASMVNC \
    KASMVNC_DISPLAY \
    KASMVNC_WEBSOCKET_PORT \
    KASMVNC_BIND_ADDRESS \
    KASMVNC_USERNAME \
    KASMVNC_PASSWORD \
    KASMVNC_GEOMETRY; do
    if [[ -v "$env_name" ]]; then
      remote_env+="$(append_remote_env_if_set "$env_name")"
    fi
  done
  printf '%s\n' "$remote_env"
}

run_bootstrap() {
  local script_dir="$1"
  local bootstrap_script="${script_dir}/bootstrap-repos.sh"
  local remote_env

  [[ -f "$bootstrap_script" ]] || die "Missing bootstrap script: ${bootstrap_script}"
  remote_env="$(get_remote_bootstrap_env)"

  log "Uploading bootstrap-repos.sh"
  scp "$bootstrap_script" "${remote}:${remote_bootstrap_path}"

  log "Running remote bootstrap"
  ssh "$remote" "chmod +x ${remote_bootstrap_path} && ${remote_env} ${remote_bootstrap_path}"
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
  local ssh_keys_archive
  script_dir="$(get_script_dir)"
  dotfiles_tmp_dir="$(mktemp -d)"
  dotfiles_archive="${dotfiles_tmp_dir}/dotfiles.tar.gz"
  ssh_keys_archive="${dotfiles_tmp_dir}/ssh-keys.tar.gz"
  trap 'rm -rf "$dotfiles_tmp_dir"' EXIT

  ensure_local_dotfiles_repo
  ensure_safe_remote_dotfiles_dir
  ensure_safe_remote_ssh_dir
  preseed_remote_z
  ensure_remote_tar
  ensure_remote_download_command
  create_dotfiles_archive "$dotfiles_archive"
  copy_dotfiles_repo "$dotfiles_archive"
  run_dotfiles_setup
  copy_ssh_keys "$ssh_keys_archive"

  if [[ "$run_remote_bootstrap" == "1" ]]; then
    run_bootstrap "$script_dir"
  else
    log "Skipping remote bootstrap"
  fi

  log "SSH bootstrap complete"
}

main "$@"
