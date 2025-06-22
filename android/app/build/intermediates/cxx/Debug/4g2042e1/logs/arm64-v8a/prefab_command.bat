@echo off
"C:\\Program Files\\Microsoft\\jdk-17.0.15.6-hotspot\\bin\\java" ^
  --class-path ^
  "C:\\Users\\kians\\.gradle\\caches\\modules-2\\files-2.1\\com.google.prefab\\cli\\2.1.0\\aa32fec809c44fa531f01dcfb739b5b3304d3050\\cli-2.1.0-all.jar" ^
  com.google.prefab.cli.AppKt ^
  --build-system ^
  cmake ^
  --platform ^
  android ^
  --abi ^
  arm64-v8a ^
  --os-version ^
  24 ^
  --stl ^
  c++_shared ^
  --ndk-version ^
  27 ^
  --output ^
  "C:\\Users\\kians\\AppData\\Local\\Temp\\agp-prefab-staging13506596034293185903\\staged-cli-output" ^
  "C:\\Users\\kians\\.gradle\\caches\\8.13\\transforms\\6e9cabc4b841ecb8bc48e2ce54799a1d\\transformed\\react-android-0.79.3-debug\\prefab" ^
  "C:\\Users\\kians\\ProcrastiNUS\\android\\app\\build\\intermediates\\cxx\\refs\\react-native-reanimated\\1162z6x5" ^
  "C:\\Users\\kians\\.gradle\\caches\\8.13\\transforms\\f134d33e9153740e4691fd3da1c6381e\\transformed\\hermes-android-0.79.3-debug\\prefab" ^
  "C:\\Users\\kians\\.gradle\\caches\\8.13\\transforms\\8050d15875717ad3c035882deb89d68f\\transformed\\fbjni-0.7.0\\prefab"
