#!/usr/bin/env bash

set -euo pipefail

workspace_dir="${WORKSPACE_DIR:-$HOME/.cache/repos}"
memory_leak_finder_repo="${MEMORY_LEAK_FINDER_REPO:-https://github.com/SimonSiefke/vscode-memory-leak-finder.git}"
vscode_repo="${VSCODE_REPO:-https://github.com/microsoft/vscode.git}"
nvm_dir="${NVM_DIR:-$HOME/.nvm}"
nvm_version="${NVM_VERSION:-v0.40.5}"
nvm_install_url="${NVM_INSTALL_URL:-https://raw.githubusercontent.com/nvm-sh/nvm/${nvm_version}/install.sh}"
install_system_deps="${INSTALL_SYSTEM_DEPS:-1}"
install_desktop="${INSTALL_DESKTOP:-1}"
install_kasmvnc="${INSTALL_KASMVNC:-1}"
start_kasmvnc="${START_KASMVNC:-1}"
kasmvnc_version="${KASMVNC_VERSION:-v1.4.0}"
kasmvnc_package_url="${KASMVNC_PACKAGE_URL:-}"
kasmvnc_display="${KASMVNC_DISPLAY:-:1}"
kasmvnc_websocket_port="${KASMVNC_WEBSOCKET_PORT:-6901}"
kasmvnc_bind_address="${KASMVNC_BIND_ADDRESS:-0.0.0.0}"
kasmvnc_geometry="${KASMVNC_GEOMETRY:-1920x1080}"
kasmvnc_username="${KASMVNC_USERNAME:-}"
kasmvnc_password="${KASMVNC_PASSWORD:-}"
kasmvnc_service_name="${KASMVNC_SERVICE_NAME:-kasmvnc.service}"

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

has_download_command() {
  command -v curl >/dev/null 2>&1 || command -v wget >/dev/null 2>&1
}

has_gssapi_headers() {
  [[ -f /usr/include/gssapi/gssapi.h ]]
}

has_common_developer_dependencies() {
  command -v git >/dev/null 2>&1 &&
    command -v make >/dev/null 2>&1 &&
    command -v gcc >/dev/null 2>&1 &&
    command -v g++ >/dev/null 2>&1 &&
    command -v pkg-config >/dev/null 2>&1 &&
    command -v Xvfb >/dev/null 2>&1 &&
    command -v python >/dev/null 2>&1 &&
    command -v python3 >/dev/null 2>&1 &&
    has_download_command &&
    has_gssapi_headers
}

has_apt_packages_installed() {
  dpkg-query --show --showformat='${db:Status-Status}\n' "$@" 2>/dev/null | awk '{ if ($0 != "installed") exit 1 }'
}

download_to_file() {
  local url="$1"
  local output="$2"
  if command -v curl >/dev/null 2>&1; then
    curl --fail --location --silent --show-error --output "$output" "$url"
    return
  fi
  if command -v wget >/dev/null 2>&1; then
    wget --quiet --output-document="$output" "$url"
    return
  fi
  die "Downloading ${url} requires curl or wget"
}

run_as_root() {
  if [[ "$(id -u)" -eq 0 ]]; then
    "$@"
    return
  fi
  if command -v sudo >/dev/null 2>&1; then
    sudo "$@"
    return
  fi
  die "Installing system dependencies requires root or sudo"
}

write_root_file() {
  local source_path="$1"
  local destination_path="$2"
  local mode="$3"
  if [[ "$(id -u)" -eq 0 ]]; then
    install -m "$mode" "$source_path" "$destination_path"
    return
  fi
  if command -v sudo >/dev/null 2>&1; then
    sudo install -m "$mode" "$source_path" "$destination_path"
    return
  fi
  die "Writing ${destination_path} requires root or sudo"
}

install_common_developer_dependencies() {
  if [[ "$install_system_deps" != "1" ]]; then
    log "Skipping system dependency installation"
    return
  fi

  if command -v apt-get >/dev/null 2>&1; then
    local apt_packages=(
      build-essential
      ca-certificates
      curl
      g++
      git
      libkrb5-dev
      libsecret-1-dev
      libx11-dev
      libxkbfile-dev
      pkg-config
      python-is-python3
      python3
      python3-setuptools
      xvfb
    )
    if has_apt_packages_installed "${apt_packages[@]}"; then
      log "Common developer dependencies are already installed"
      return
    fi

    log "Installing common developer dependencies"
    run_as_root env DEBIAN_FRONTEND=noninteractive apt-get update
    run_as_root env DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends "${apt_packages[@]}"
    return
  fi

  if has_common_developer_dependencies; then
    log "Common developer dependencies are already installed"
    return
  fi

  log "Installing common developer dependencies"
  if command -v dnf >/dev/null 2>&1; then
    run_as_root dnf install -y ca-certificates curl gcc gcc-c++ git krb5-devel make pkgconf-pkg-config python3 xorg-x11-server-Xvfb
    return
  fi

  if command -v yum >/dev/null 2>&1; then
    run_as_root yum install -y ca-certificates curl gcc gcc-c++ git krb5-devel make pkgconfig python3 xorg-x11-server-Xvfb
    return
  fi

  if command -v apk >/dev/null 2>&1; then
    run_as_root apk add --no-cache build-base ca-certificates curl git krb5-dev pkgconf python3 xvfb
    return
  fi

  if command -v pacman >/dev/null 2>&1; then
    run_as_root pacman -Sy --needed --noconfirm base-devel ca-certificates curl git krb5 pkgconf python3 xorg-server-xvfb
    return
  fi

  if command -v zypper >/dev/null 2>&1; then
    run_as_root zypper --non-interactive install ca-certificates curl gcc gcc-c++ git krb5-devel make pkg-config python3 xorg-x11-server-Xvfb
    return
  fi

  die "No supported package manager found. Install git, curl or wget, make, gcc, g++, python, python3, pkg-config, Xvfb, and Kerberos/GSSAPI development headers, then rerun this script."
}

install_lightweight_desktop() {
  if [[ "$install_system_deps" != "1" || "$install_desktop" != "1" ]]; then
    log "Skipping desktop installation"
    return
  fi

  if ! command -v apt-get >/dev/null 2>&1; then
    die "Desktop installation is only automated for apt-based systems. Set INSTALL_DESKTOP=0 to skip it."
  fi

  local apt_packages=(
    dbus-x11
    xfce4
    xfce4-terminal
    x11-xserver-utils
  )
  if has_apt_packages_installed "${apt_packages[@]}"; then
    log "Lightweight desktop is already installed"
    return
  fi

  log "Installing lightweight XFCE desktop"
  run_as_root env DEBIAN_FRONTEND=noninteractive apt-get update
  run_as_root env DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends "${apt_packages[@]}"
}

get_desktop_user() {
  local desktop_user="${DESKTOP_USER:-${SUDO_USER:-${USER:-}}}"
  if [[ -n "$desktop_user" ]]; then
    printf '%s\n' "$desktop_user"
  fi
  return 0
}

get_desktop_home() {
  local desktop_user="$1"
  local desktop_home=""
  local desktop_record=""
  if command -v getent >/dev/null 2>&1; then
    if desktop_record="$(getent passwd "$desktop_user")"; then
      desktop_home="$(awk -F: '{ print $6; exit }' <<<"$desktop_record")"
    fi
  fi
  if [[ -z "$desktop_home" && "$desktop_user" == "${USER:-}" ]]; then
    desktop_home="$HOME"
  fi
  if [[ -n "$desktop_home" ]]; then
    printf '%s\n' "$desktop_home"
  fi
  return 0
}

get_user_group() {
  local user="$1"
  id -gn "$user" 2>/dev/null || printf '%s\n' "$user"
}

configure_desktop_session() {
  if [[ "$install_system_deps" != "1" || "$install_desktop" != "1" ]]; then
    return
  fi

  if ! command -v startxfce4 >/dev/null 2>&1; then
    return
  fi

  local desktop_user
  local desktop_home
  local vnc_dir
  local xstartup_path
  desktop_user="$(get_desktop_user)"
  if [[ -z "$desktop_user" ]]; then
    return
  fi
  desktop_home="$(get_desktop_home "$desktop_user")"
  if [[ -z "$desktop_home" ]]; then
    return
  fi
  vnc_dir="${desktop_home}/.vnc"
  xstartup_path="${vnc_dir}/xstartup"

  if [[ -f "$xstartup_path" ]]; then
    log "VNC desktop startup is already configured"
    return
  fi

  log "Configuring VNC desktop startup for ${desktop_user}"
  install -d -m 700 "$vnc_dir"
  cat >"$xstartup_path" <<'EOF'
#!/usr/bin/env sh
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
exec startxfce4
EOF
  chmod 700 "$xstartup_path"
  if [[ "$(id -u)" -eq 0 ]]; then
    chown -R "${desktop_user}:${desktop_user}" "$vnc_dir" 2>/dev/null || chown -R "$desktop_user" "$vnc_dir"
  fi
}

get_os_release_value() {
  local key="$1"
  local value=""
  if [[ -f /etc/os-release ]]; then
    value="$(awk -F= -v key="$key" '$1 == key { gsub(/^"|"$/, "", $2); print $2; exit }' /etc/os-release)"
  fi
  printf '%s\n' "$value"
}

get_kasmvnc_deb_codename() {
  local version_codename
  version_codename="$(get_os_release_value VERSION_CODENAME)"

  case "$version_codename" in
    bookworm | bullseye | focal | jammy | kali-rolling | noble | trixie)
      printf '%s\n' "$version_codename"
      return
      ;;
    resolute)
      printf 'noble\n'
      return
      ;;
  esac

  return 1
}

get_kasmvnc_deb_arch() {
  local arch
  if ! command -v dpkg >/dev/null 2>&1; then
    return 1
  fi
  arch="$(dpkg --print-architecture)"

  case "$arch" in
    amd64 | arm64)
      printf '%s\n' "$arch"
      return
      ;;
  esac

  return 1
}

get_kasmvnc_package_name_from_url() {
  local url="$1"
  local package_name="${url##*/}"
  package_name="${package_name%%\?*}"
  if [[ "$package_name" != *.deb ]]; then
    package_name="kasmvncserver.deb"
  fi
  printf '%s\n' "$package_name"
}

get_kasmvnc_deb_url() {
  if [[ -n "$kasmvnc_package_url" ]]; then
    printf '%s\n' "$kasmvnc_package_url"
    return
  fi

  local version_number="${kasmvnc_version#v}"
  local codename
  local arch
  if ! codename="$(get_kasmvnc_deb_codename)"; then
    printf 'Error: Unsupported distro codename for KasmVNC: %s. Set KASMVNC_PACKAGE_URL to a matching KasmVNC package.\n' "$(get_os_release_value VERSION_CODENAME || printf unknown)" >&2
    return 1
  fi
  if ! arch="$(get_kasmvnc_deb_arch)"; then
    printf 'Error: Unsupported architecture for KasmVNC: %s. Set KASMVNC_PACKAGE_URL to a matching KasmVNC package.\n' "$(dpkg --print-architecture 2>/dev/null || printf unknown)" >&2
    return 1
  fi
  printf 'https://github.com/kasmtech/KasmVNC/releases/download/%s/kasmvncserver_%s_%s_%s.deb\n' "$kasmvnc_version" "$codename" "$version_number" "$arch"
}

get_kasmvnc_group_user() {
  local group_user="${KASMVNC_GROUP_USER:-${SUDO_USER:-${USER:-}}}"
  if [[ -n "$group_user" && "$group_user" != "root" ]]; then
    printf '%s\n' "$group_user"
  fi
}

add_kasmvnc_user_to_ssl_cert_group() {
  local group_user
  group_user="$(get_kasmvnc_group_user)"
  if [[ -z "$group_user" ]]; then
    return
  fi

  log "Adding ${group_user} to ssl-cert group for KasmVNC"
  run_as_root usermod -a -G ssl-cert "$group_user"
}

install_kasmvnc_server() {
  if [[ "$install_system_deps" != "1" || "$install_kasmvnc" != "1" ]]; then
    log "Skipping KasmVNC installation"
    return
  fi

  if ! command -v apt-get >/dev/null 2>&1; then
    die "KasmVNC installation is only automated for apt-based systems. Set INSTALL_KASMVNC=0 to skip it."
  fi

  if has_apt_packages_installed kasmvncserver; then
    log "KasmVNC is already installed"
    add_kasmvnc_user_to_ssl_cert_group
    return
  fi

  local package_url
  local package_name
  local package_dir
  local package_path
  if ! package_url="$(get_kasmvnc_deb_url)"; then
    return 1
  fi
  package_name="$(get_kasmvnc_package_name_from_url "$package_url")"
  package_dir="$(mktemp -d)"
  package_path="${package_dir}/${package_name}"

  log "Installing KasmVNC ${kasmvnc_version}"
  if ! download_to_file "$package_url" "$package_path"; then
    rm -rf "$package_dir"
    return 1
  fi
  run_as_root env DEBIAN_FRONTEND=noninteractive apt-get update
  if ! run_as_root env DEBIAN_FRONTEND=noninteractive apt-get install -y "$package_path"; then
    rm -rf "$package_dir"
    return 1
  fi
  rm -rf "$package_dir"

  add_kasmvnc_user_to_ssl_cert_group
}

generate_kasmvnc_password() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 32 | tr -dc 'A-Za-z0-9' | cut -c1-24
    return
  fi
  dd if=/dev/urandom bs=32 count=1 2>/dev/null | base64 | tr -dc 'A-Za-z0-9' | cut -c1-24
}

ensure_kasmvnc_password() {
  local desktop_user="$1"
  local desktop_home="$2"
  local desktop_group
  local password_file="${desktop_home}/.kasmpasswd"
  local password_text_path="${desktop_home}/.vnc/kasmvnc-password.txt"
  local password="$kasmvnc_password"

  if [[ -f "$password_file" && -f "$password_text_path" && -z "$password" ]]; then
    log "KasmVNC password is already configured"
    return
  fi

  if [[ -z "$password" ]]; then
    password="$(generate_kasmvnc_password)"
  fi
  [[ -n "$password" ]] || die "Failed to generate KasmVNC password"

  log "Configuring KasmVNC password for ${kasmvnc_username}"
  install -d -m 700 "${desktop_home}/.vnc"
  printf '%s\n%s\n' "$password" "$password" | vncpasswd -u "$kasmvnc_username" -ow "$password_file" >/dev/null
  printf '%s\n' "$password" >"$password_text_path"
  chmod 600 "$password_file" "$password_text_path"

  if [[ "$(id -u)" -eq 0 ]]; then
    desktop_group="$(get_user_group "$desktop_user")"
    chown "$desktop_user:$desktop_group" "$password_file" "$password_text_path" 2>/dev/null || chown "$desktop_user" "$password_file" "$password_text_path"
  fi
}

configure_kasmvnc_server() {
  local desktop_user="$1"
  local desktop_home="$2"
  local desktop_group
  local vnc_dir="${desktop_home}/.vnc"
  local config_path="${vnc_dir}/kasmvnc.yaml"
  local width="${kasmvnc_geometry%x*}"
  local height="${kasmvnc_geometry#*x}"

  [[ "$width" != "$kasmvnc_geometry" && -n "$width" && -n "$height" ]] || die "KASMVNC_GEOMETRY must look like 1920x1080"

  log "Configuring KasmVNC server"
  install -d -m 700 "$vnc_dir"
  cat >"$config_path" <<EOF
desktop:
  resolution:
    width: ${width}
    height: ${height}
  allow_resize: true
  pixel_depth: 24
network:
  protocol: http
  interface: ${kasmvnc_bind_address}
  websocket_port: ${kasmvnc_websocket_port}
  ssl:
    require_ssl: true
server:
  advanced:
    kasm_password_file: \${HOME}/.kasmpasswd
command_line:
  prompt: false
EOF
  chmod 600 "$config_path"

  if [[ "$(id -u)" -eq 0 ]]; then
    desktop_group="$(get_user_group "$desktop_user")"
    chown "$desktop_user:$desktop_group" "$config_path" 2>/dev/null || chown "$desktop_user" "$config_path"
  fi
}

configure_kasmvnc_service() {
  local desktop_user="$1"
  local desktop_home="$2"
  local service_path="/etc/systemd/system/${kasmvnc_service_name}"
  local kasmvncserver_path
  local service_tmp

  command -v systemctl >/dev/null 2>&1 || die "Starting KasmVNC as a daemon requires systemd"
  kasmvncserver_path="$(command -v kasmvncserver || true)"
  [[ -n "$kasmvncserver_path" ]] || die "KasmVNC server binary is missing"

  service_tmp="$(mktemp)"
  cat >"$service_tmp" <<EOF
[Unit]
Description=KasmVNC remote desktop
After=network.target

[Service]
Type=simple
User=${desktop_user}
WorkingDirectory=${desktop_home}
Environment=HOME=${desktop_home}
Environment=USER=${desktop_user}
ExecStartPre=-${kasmvncserver_path} -kill ${kasmvnc_display}
ExecStart=${kasmvncserver_path} ${kasmvnc_display} -fg -geometry ${kasmvnc_geometry}
ExecStop=${kasmvncserver_path} -kill ${kasmvnc_display}
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

  log "Installing ${kasmvnc_service_name}"
  write_root_file "$service_tmp" "$service_path" 644
  rm -f "$service_tmp"

  run_as_root systemctl daemon-reload
  run_as_root systemctl enable --now "$kasmvnc_service_name"
}

start_kasmvnc_service() {
  if [[ "$start_kasmvnc" != "1" ]]; then
    log "Skipping KasmVNC service startup"
    return
  fi

  if [[ "$install_kasmvnc" != "1" ]]; then
    log "Skipping KasmVNC service startup"
    return
  fi

  local desktop_user
  local desktop_home
  desktop_user="$(get_desktop_user)"
  [[ -n "$desktop_user" ]] || die "Could not determine user for KasmVNC service"
  desktop_home="$(get_desktop_home "$desktop_user")"
  [[ -n "$desktop_home" ]] || die "Could not determine home directory for ${desktop_user}"

  if [[ -z "$kasmvnc_username" ]]; then
    kasmvnc_username="$desktop_user"
  fi

  ensure_kasmvnc_password "$desktop_user" "$desktop_home"
  configure_kasmvnc_server "$desktop_user" "$desktop_home"
  configure_kasmvnc_service "$desktop_user" "$desktop_home"

  log "KasmVNC is configured"
  printf 'KasmVNC URL: https://<host>:%s\n' "$kasmvnc_websocket_port"
  printf 'KasmVNC username: %s\n' "$kasmvnc_username"
  printf 'KasmVNC password file: %s\n' "${desktop_home}/.vnc/kasmvnc-password.txt"
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

install_global_npm_package() {
  local repo_dir="$1"
  local repo_name="$2"
  local package_name="$3"

  log "Installing ${package_name}"
  (
    cd "$repo_dir"
    use_repo_node "$repo_dir" "$repo_name"
    npm install --global "$package_name"
  )
}

main() {
  install_common_developer_dependencies
  install_lightweight_desktop
  install_kasmvnc_server
  configure_desktop_session
  start_kasmvnc_service
  require_command git
  mkdir -p "$workspace_dir"
  load_nvm

  clone_or_fetch_repo "$memory_leak_finder_repo" "$memory_leak_finder_dir" "vscode-memory-leak-finder"
  install_dependencies "$memory_leak_finder_dir" "vscode-memory-leak-finder" npm ci
  install_global_npm_package "$memory_leak_finder_dir" "vscode-memory-leak-finder" @openai/codex

  clone_or_fetch_repo "$vscode_repo" "$vscode_dir" "VS Code"
  install_dependencies "$vscode_dir" "VS Code" npm install

  log "Bootstrap complete"
  printf 'Workspace: %s\n' "$workspace_dir"
  printf 'vscode-memory-leak-finder: %s\n' "$memory_leak_finder_dir"
  printf 'VS Code: %s\n' "$vscode_dir"
  printf 'VS Code launcher: %s\n' "$vscode_dir/scripts/code.sh"
}

main "$@"
