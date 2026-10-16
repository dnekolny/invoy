#!/usr/bin/env bash
# Vytvoří .env.local v kořeni repa. Hodnoty se zadávají skrytě a nikde se nevypisují.
set -euo pipefail

cd "$(dirname "$0")/.."
TARGET=".env.local"

if [[ -e "$TARGET" ]]; then
  read -r -p "$TARGET už existuje, přepsat? [y/N] " answer
  [[ "$answer" == [yY] ]] || { echo "Zrušeno."; exit 0; }
fi

ask() {
  local var="$1" prompt="$2" default="${3:-}" value
  if [[ -n "$default" ]]; then
    read -r -p "$prompt [$default]: " value
    value="${value:-$default}"
  else
    read -r -p "$prompt: " value
  fi
  printf '%s=%s\n' "$var" "$value" >> "$TARGET.tmp"
}

ask_secret() {
  local var="$1" prompt="$2" value
  read -r -s -p "$prompt: " value; echo
  printf '%s=%s\n' "$var" "$value" >> "$TARGET.tmp"
}

: > "$TARGET.tmp"
chmod 600 "$TARGET.tmp"

echo "== Google OAuth (Google Cloud Console → Credentials) =="
ask        GOOGLE_CLIENT_ID     "Client ID"
ask_secret GOOGLE_CLIENT_SECRET "Client Secret"

echo
echo "== SMTP pro systémové e-maily (přihlašovací kódy) =="
ask        SMTP_HOST "SMTP host" "smtp.gmail.com"
ask        SMTP_PORT "SMTP port" "587"
ask        SMTP_USER "SMTP uživatel (e-mail)"
ask_secret SMTP_PASS "SMTP heslo / app password"
ask        SMTP_FROM "Odesílatel (From)" "Invoy <$(grep '^SMTP_USER=' "$TARGET.tmp" | cut -d= -f2-)>"

echo
printf 'BETTER_AUTH_SECRET=%s\n' "$(openssl rand -base64 32)" >> "$TARGET.tmp"
printf 'BETTER_AUTH_URL=%s\n' "http://localhost:3000" >> "$TARGET.tmp"

mv "$TARGET.tmp" "$TARGET"
chmod 600 "$TARGET"

echo "Hotovo: $TARGET ($(grep -c '=' "$TARGET") proměnných, práva 600)."
echo "Ověření bez hodnot: cut -d= -f1 $TARGET"
