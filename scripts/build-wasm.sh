#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
mbedtls_build_dir="${MBEDTLS_BUILD_DIR:-$project_root/mbedtls/build-wasm}"
mbedcrypto_lib="$mbedtls_build_dir/library/libmbedcrypto.a"

command -v em++ >/dev/null || { echo 'em++ was not found. Activate the Emscripten SDK first.' >&2; exit 1; }
[[ -f "$mbedcrypto_lib" ]] || { echo "Missing Emscripten-built mbedTLS library: $mbedcrypto_lib" >&2; exit 1; }

mkdir -p "$project_root/public/wasm"
em++ "$project_root/cpp/vault_core.cpp" -O3 \
  -I"$project_root/mbedtls/include" "$mbedcrypto_lib" \
  -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=web -sALLOW_MEMORY_GROWTH=1 \
  -sEXPORTED_FUNCTIONS='["_encrypt_json","_decrypt_json"]' \
  -sEXPORTED_RUNTIME_METHODS='["cwrap"]' \
  -o "$project_root/public/wasm/vault_core.js"
