#include <mbedtls/gcm.h>
#include <mbedtls/sha256.h>
#include <cstring>
#include <cstdlib>
#include <cstdio>
#include <string>
#include <vector>
#include <sstream>
#include <algorithm>
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

// The adaptation engine works only with aggregated play signals.  It does not
// receive names, voice notes, or any medical information.
static std::vector<std::string> split(const std::string &value, char delimiter)
{
  std::vector<std::string> values;
  std::stringstream stream(value);
  std::string item;
  while (std::getline(stream, item, delimiter)) values.push_back(item);
  return values;
}

static int level_value(const std::string &level)
{
  if (level == "stretch") return 2;
  if (level == "steady") return 1;
  return 0;
}

static const char *level_name(int level)
{
  return level >= 2 ? "stretch" : level == 1 ? "steady" : "gentle";
}

static bool contains(const std::vector<std::string> &items, const std::string &value)
{
  return std::find(items.begin(), items.end(), value) != items.end();
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

  // feeling: 0 = hard, 1 = okay, 2 = enjoyed.  The returned level controls
  // only presentation difficulty (number of choices), never a health score.
  EMSCRIPTEN_KEEPALIVE
  const char *adapt_game_state(int previous_level, int previous_attempts,
                               double recent_average, int correct, int rounds,
                               int feeling, int hints_used)
  {
    static std::string out;
    const int attempts = previous_attempts + 1;
    const double accuracy = rounds > 0 ? static_cast<double>(correct) / rounds : 0.0;
    const double average = previous_attempts > 0
      ? ((recent_average * std::min(previous_attempts, 5)) + accuracy) / (std::min(previous_attempts, 5) + 1)
      : accuracy;
    int level = std::max(0, std::min(2, previous_level));
    if (feeling == 0 || hints_used >= 2 || (attempts >= 3 && average < 0.5)) level = 0;
    else if (attempts >= 3 && feeling == 2 && average >= 0.8) level = 2;
    else if (attempts >= 2 && average >= 0.6) level = 1;
    out = std::string("{\"level\":\"") + level_name(level) + "\",\"accuracy\":" + std::to_string(accuracy) + "}";
    return out.c_str();
  }

  // game_stats format: gameId:plays:average;gameId:plays:average
  // interests format: farm,food,craft,music,family,work
  // levels format: gameId:gentle;gameId:steady
  EMSCRIPTEN_KEEPALIVE
  const char *recommend_activity(const char *game_stats, const char *interests, const char *levels)
  {
    static std::string out;
    const std::vector<std::string> game_ids = {"family-match", "culture-memory", "sequence-story", "name-place", "everyday-skills", "sound-memory", "local-greetings", "festival-treasures", "market-memory"};
    const std::vector<std::string> interest_values = split(interests ? interests : "", ',');
    const std::string stats_source = game_stats ? game_stats : "";
    const std::string levels_source = levels ? levels : "";
    const std::vector<std::string> stats = split(stats_source, ';');
    std::string chosen;
    std::string reason = "variety";
    const std::vector<std::pair<std::string, std::string>> interest_games = {{"family", "family-match"}, {"food", "market-memory"}, {"music", "sound-memory"}, {"craft", "everyday-skills"}, {"farm", "everyday-skills"}, {"work", "everyday-skills"}};
    for (const auto &mapping : interest_games) {
      if (!contains(interest_values, mapping.first)) continue;
      if (stats_source.find(mapping.second + ":") == std::string::npos) { chosen = mapping.second; reason = "familiar-interest"; break; }
      if (chosen.empty()) { chosen = mapping.second; reason = "familiar-interest"; }
    }
    if (chosen.empty()) {
      for (const std::string &game : game_ids) {
        if (stats_source.find(game + ":") == std::string::npos) { chosen = game; reason = "first-activity"; break; }
      }
    }
    if (chosen.empty()) {
      int lowest_plays = 2147483647;
      double lowest_average = 1e9;
      for (const std::string &entry : stats) {
        const std::vector<std::string> fields = split(entry, ':');
        if (fields.size() != 3) continue;
        const int plays = std::atoi(fields[1].c_str());
        const double average = std::atof(fields[2].c_str());
        if (plays < lowest_plays || (plays == lowest_plays && average < lowest_average)) { chosen = fields[0]; lowest_plays = plays; lowest_average = average; }
      }
      if (chosen.empty()) { chosen = "family-match"; reason = "first-activity"; }
    }
    std::string level = "gentle";
    for (const std::string &entry : split(levels_source, ';')) {
      const std::vector<std::string> fields = split(entry, ':');
      if (fields.size() == 2 && fields[0] == chosen) { level = level_name(level_value(fields[1])); break; }
    }
    out = "{\"game\":\"" + chosen + "\",\"level\":\"" + level + "\",\"reasonCode\":\"" + reason + "\"}";
    return out.c_str();
  }
}
