#include <mbedtls/gcm.h>
#include <mbedtls/sha256.h>
#include <cstring>
#include <cstdlib>
#include <cstdio>
#include <string>
#include <vector>
#include <emscripten/emscripten.h>

EM_JS(int, fill_random_bytes, (unsigned char *output, int length), {
  if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') return 0;
  crypto.getRandomValues(HEAPU8.subarray(output, output + length));
  return 1;
});

static void key_from_secret(const char *secret, unsigned char key[32])
{
  mbedtls_sha256((const unsigned char *)secret, std::strlen(secret), key, 0);
}

static char hex_digit(unsigned char value)
{
  return value < 10 ? static_cast<char>('0' + value) : static_cast<char>('a' + value - 10);
}

static std::string hex_encode(const unsigned char *input, size_t length)
{
  std::string output;
  output.reserve(length * 2);
  for (size_t i = 0; i < length; ++i)
  {
    output += hex_digit(input[i] >> 4);
    output += hex_digit(input[i] & 0x0f);
  }
  return output;
}

static int hex_value(char character)
{
  if (character >= '0' && character <= '9') return character - '0';
  if (character >= 'a' && character <= 'f') return character - 'a' + 10;
  if (character >= 'A' && character <= 'F') return character - 'A' + 10;
  return -1;
}

static bool hex_decode(const std::string &input, std::vector<unsigned char> &output)
{
  if (input.size() % 2 != 0) return false;
  output.resize(input.size() / 2);
  for (size_t i = 0; i < output.size(); ++i)
  {
    const int high = hex_value(input[i * 2]);
    const int low = hex_value(input[i * 2 + 1]);
    if (high < 0 || low < 0) return false;
    output[i] = static_cast<unsigned char>((high << 4) | low);
  }
  return true;
}

static bool json_hex_field(const char *json, const char *name, std::vector<unsigned char> &output)
{
  const std::string marker = std::string("\"") + name + "\":\"";
  const std::string source(json ? json : "");
  const size_t start = source.find(marker);
  if (start == std::string::npos) return false;
  const size_t value_start = start + marker.size();
  const size_t value_end = source.find('"', value_start);
  if (value_end == std::string::npos) return false;
  return hex_decode(source.substr(value_start, value_end - value_start), output);
}

extern "C"
{
  EMSCRIPTEN_KEEPALIVE
  const char *encrypt_json(const char *plaintext, const char *secret)
  {
    static std::string out;
    unsigned char key[32], iv[12];
    key_from_secret(secret, key);
    if (!fill_random_bytes(iv, sizeof(iv)))
    {
      out.clear();
      return out.c_str();
    }
    size_t n = std::strlen(plaintext);
    std::vector<unsigned char> ct(n);
    unsigned char tag[16];
    mbedtls_gcm_context ctx;
    mbedtls_gcm_init(&ctx);
    int rc = mbedtls_gcm_setkey(&ctx, MBEDTLS_CIPHER_ID_AES, key, 256);
    if (!rc)
      rc = mbedtls_gcm_crypt_and_tag(&ctx, MBEDTLS_GCM_ENCRYPT, n, iv, 12, nullptr, 0, (const unsigned char *)plaintext, ct.data(), 16, tag);
    mbedtls_gcm_free(&ctx);
    if (rc)
    {
      out.clear();
      return out.c_str();
    }
    out = "{";
    out = "{\"v\":1,\"iv\":\"" + hex_encode(iv, sizeof(iv)) +
          "\",\"tag\":\"" + hex_encode(tag, sizeof(tag)) +
          "\",\"data\":\"" + hex_encode(ct.data(), ct.size()) + "\"}";
    return out.c_str();
  }

  EMSCRIPTEN_KEEPALIVE
  const char *decrypt_json(const char *blob, const char *secret)
  {
    static std::string out;
    std::vector<unsigned char> iv, tag, ciphertext;
    if (!json_hex_field(blob, "iv", iv) || !json_hex_field(blob, "tag", tag) ||
        !json_hex_field(blob, "data", ciphertext) || iv.size() != 12 || tag.size() != 16)
    {
      out.clear();
      return out.c_str();
    }

    unsigned char key[32];
    key_from_secret(secret, key);
    std::vector<unsigned char> plaintext(ciphertext.size());
    mbedtls_gcm_context ctx;
    mbedtls_gcm_init(&ctx);
    int rc = mbedtls_gcm_setkey(&ctx, MBEDTLS_CIPHER_ID_AES, key, 256);
    if (!rc)
      rc = mbedtls_gcm_auth_decrypt(&ctx, ciphertext.size(), iv.data(), iv.size(), nullptr, 0,
                                    tag.data(), tag.size(), ciphertext.data(), plaintext.data());
    mbedtls_gcm_free(&ctx);
    if (rc)
    {
      out.clear();
      return out.c_str();
    }
    out.assign(reinterpret_cast<const char *>(plaintext.data()), plaintext.size());
    return out.c_str();
  }
}
