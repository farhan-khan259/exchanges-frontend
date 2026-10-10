#!/usr/bin/env bash
set -euo pipefail
app_root="$(cd "$(dirname "$0")" && pwd)"
: "${KHATA_ANDROID_SDK:?Set KHATA_ANDROID_SDK to your installed Android SDK directory}"
: "${KHATA_KEYSTORE:?Set KHATA_KEYSTORE to your release signing keystore}"
: "${KHATA_KEY_ALIAS:?Set KHATA_KEY_ALIAS}"
: "${KHATA_KEYSTORE_PASSWORD:?Set KHATA_KEYSTORE_PASSWORD}"
build_tools="$KHATA_ANDROID_SDK/build-tools/35.0.0"
platform_jar="$KHATA_ANDROID_SDK/platforms/android-35/android.jar"
work_dir="$app_root/build"
rm -rf "$work_dir"
mkdir -p "$work_dir/classes" "$work_dir/dex" "$work_dir/gen" "$app_root/dist"
"$build_tools/aapt2" compile --dir "$app_root/app/src/main/res" -o "$work_dir/resources.zip"
"$build_tools/aapt2" link -o "$work_dir/base.apk" --manifest "$app_root/app/src/main/AndroidManifest.xml" -I "$platform_jar" --java "$work_dir/gen" "$work_dir/resources.zip"
if command -v javac >/dev/null; then compiler=(javac); else compiler=(java -m jdk.compiler/com.sun.tools.javac.Main); fi
"${compiler[@]}" -encoding UTF-8 -source 8 -target 8 -classpath "$platform_jar" -d "$work_dir/classes" "$app_root/app/src/main/java/com/ahmedsolutions/khata/MainActivity.java" "$work_dir/gen/com/ahmedsolutions/khata/R.java"
mapfile -t class_files < <(find "$work_dir/classes" -name '*.class')
"$build_tools/d8" --min-api 24 --lib "$platform_jar" --output "$work_dir/dex" "${class_files[@]}"
cp "$work_dir/base.apk" "$work_dir/unsigned.apk"
(cd "$work_dir/dex" && zip -q -j "$work_dir/unsigned.apk" classes.dex)
"$build_tools/zipalign" -f 4 "$work_dir/unsigned.apk" "$work_dir/aligned.apk"
"$build_tools/apksigner" sign --ks "$KHATA_KEYSTORE" --ks-key-alias "$KHATA_KEY_ALIAS" --ks-pass env:KHATA_KEYSTORE_PASSWORD --out "$app_root/dist/Khata_OS_Android.apk" "$work_dir/aligned.apk"
"$build_tools/apksigner" verify --verbose "$app_root/dist/Khata_OS_Android.apk"
