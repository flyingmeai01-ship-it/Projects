cmake_minimum_required(VERSION 3.16)
project(care_vault CXX)
add_executable(vault_core vault_core.cpp)
target_compile_options(vault_core PRIVATE -O3)
# Configure mbedTLS include/library paths for your Emscripten toolchain.
