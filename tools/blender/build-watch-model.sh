#!/usr/bin/env sh

set -eu

repository_root=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
build_directory="$repository_root/.asset-build"
raw_model="$build_directory/watch-model.raw.glb"
optimized_model="$repository_root/public/models/watch-model.glb"

if [ -n "${BLENDER_BIN:-}" ]; then
  blender_bin=$BLENDER_BIN
elif command -v blender >/dev/null 2>&1; then
  blender_bin=blender
elif [ -x "/Applications/Blender.app/Contents/MacOS/Blender" ]; then
  blender_bin="/Applications/Blender.app/Contents/MacOS/Blender"
else
  echo "Blender was not found. Set BLENDER_BIN to the Blender executable." >&2
  exit 1
fi

mkdir -p "$build_directory"

"$blender_bin" \
  --background \
  --factory-startup \
  --python "$repository_root/tools/blender/generate-watch-model.py" \
  -- \
  --output "$raw_model"

"$repository_root/node_modules/.bin/gltf-transform" optimize \
  "$raw_model" \
  "$optimized_model" \
  --compress meshopt \
  --flatten false \
  --instance false \
  --join false \
  --palette false \
  --simplify false \
  --texture-compress false

"$repository_root/node_modules/.bin/gltf-transform" inspect "$optimized_model"
